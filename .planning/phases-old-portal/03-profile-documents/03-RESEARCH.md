# Phase 3: Profile & Documents - Research

**Researched:** 2026-03-14
**Domain:** Patient profile management, document viewing/uploading via Asher Med S3
**Confidence:** HIGH

## Summary

Phase 3 adds two portal pages -- a profile page showing personal info, physical measurements, and editable shipping address, and a documents page showing previously uploaded files with the ability to upload new ones. Both pages live under the existing `/portal` layout (Phase 1 auth guard, Phase 2 dashboard patterns) and pull data from Asher Med's partner API.

The Asher Med API already has all needed endpoints: `getPatientById()` returns personal info, address, and measurements; `updatePatient()` writes address changes back; `getPresignedUploadUrl()` and `getPreviewUrl()` handle S3 file operations. The existing member API routes (`/api/member/profile`, `/api/member/files`) implement similar logic but authenticate via the old magic-link `cultr_session` cookie. Phase 3 needs portal-auth equivalents that use `verifyPortalAuth()` with the `cultr_portal_access` cookie and look up the patient by `asherPatientId` from the JWT rather than by email.

**Critical discovery:** The `asher_uploaded_files` table exists (migration 008) but has NO write path -- the intake upload route gets presigned URLs and sends S3 keys to Asher Med but never persists them locally. For document listing (DOCS-01), we need to either (a) start recording uploads in `asher_uploaded_files` going forward and accept that historical documents won't appear, or (b) extract S3 keys from the order request data sent to Asher Med. Since the S3 keys are embedded in the `AsherNewOrderRequest` body (fields `frontIDFileS3Key`, `telehealthSigS3Key`, `consentCompoundedSigS3Key`) and this data is NOT stored locally in any retrievable form, the practical approach is: write to `asher_uploaded_files` on future uploads (both portal and intake) and populate it retroactively from `pending_intakes.intake_data` JSONB where possible.

**Primary recommendation:** Build two new portal API routes (`/api/portal/profile` GET/PUT, `/api/portal/documents` GET/POST) following the Phase 2 pattern, then two new client pages (`/portal/profile`, `/portal/documents`) matching the existing dashboard design language.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | Member can view personal info (name, DOB, phone, email, gender) | `getPatientById()` returns all fields on `AsherPatient` interface. Read-only display. |
| PROF-02 | Member can view shipping address on file | `AsherPatient` has `address1`, `address2`, `city`, `stateAbbreviation`, `zipcode`, `country`, `apartmentNumber`. |
| PROF-03 | Member can edit shipping address (synced back to Asher Med) | `updatePatient(patientId, { address1, city, stateAbbreviation, zipcode, ... })` via PUT. Existing pattern in `/api/member/profile` PUT handler. |
| PROF-04 | Member can view physical measurements (height, weight, BMI) | `AsherPatient` has `height` (inches), `weight` (lbs), `bmi`, `currentBodyFat`. Read-only display. |
| DOCS-01 | Member can view uploaded documents via S3 preview URLs | `getPreviewUrl(s3Key)` generates temporary preview URLs. Need to populate `asher_uploaded_files` table for the document list. |
| DOCS-02 | Member can upload new documents from portal | `getPresignedUploadUrl(contentType)` + PUT to S3. Reuse existing upload flow from `IDUploader.tsx`. Must also INSERT into `asher_uploaded_files`. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ^14.2.0 | Page routes, API routes | Project framework |
| @vercel/postgres | ^0.10.0 | Database queries | Project DB driver |
| jose | ^6.1.3 | JWT auth verification | Used by portal-auth.ts |
| Lucide React | ^0.563.0 | Icons | Project icon library |
| Zod | ^3.23.0 | Input validation | Project validation library |
| Tailwind CSS | ^3.4.3 | Styling | Project styling approach |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | ^2.1.1 / ^3.4.0 | Class merging via `cn()` | All className construction |

### No New Dependencies
Phase 3 requires zero new npm packages. Everything is covered by existing libraries.

## Architecture Patterns

### Recommended Project Structure
```
app/portal/
  profile/
    page.tsx              # Server page: metadata + ProfileClient
    ProfileClient.tsx     # Client component: fetches /api/portal/profile, renders UI
  documents/
    page.tsx              # Server page: metadata + DocumentsClient
    DocumentsClient.tsx   # Client component: fetches /api/portal/documents, renders UI

app/api/portal/
  profile/
    route.ts              # GET: fetch patient data from Asher Med
                          # PUT: update shipping address -> Asher Med
  documents/
    route.ts              # GET: list documents from asher_uploaded_files + generate preview URLs
                          # POST: get presigned URL, record in asher_uploaded_files

lib/
  portal-profile.ts       # Optional: type definitions for profile/document shapes
```

### Pattern 1: Portal API Route with Asher Med Proxy
**What:** API route authenticates via `verifyPortalAuth()`, uses `asherPatientId` from JWT to call Asher Med, returns shaped data.
**When to use:** All portal data routes.
**Example (from Phase 2):**
```typescript
// Source: app/api/portal/orders/route.ts (existing)
export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (!auth.asherPatientId) {
    return NextResponse.json({ success: true, orders: [] })
  }
  try {
    const result = await getOrders({ patientId: auth.asherPatientId })
    // ... shape and return data
  } catch {
    return NextResponse.json({ success: false, error: '...' }, { status: 502 })
  }
}
```

### Pattern 2: Portal Client Page with Fetch-on-Mount
**What:** Client component fetches from portal API on mount, manages loading/error/data states, matches dashboard design.
**When to use:** All portal pages.
**Example (from Phase 2):**
```typescript
// Source: app/portal/dashboard/DashboardClient.tsx (existing)
export default function DashboardClient() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // ... fetch, check cancelled, set state
    }
    load()
    return () => { cancelled = true }
  }, [])
  // ... render loading skeleton, error, data
}
```

### Pattern 3: File Upload Flow
**What:** Client gets presigned URL from API, uploads directly to S3, API records S3 key in DB.
**When to use:** DOCS-02 upload feature.
**Example (from existing IDUploader.tsx):**
```typescript
// 1. Get presigned URL from our API
const res = await fetch('/api/portal/documents', {
  method: 'POST',
  body: JSON.stringify({ contentType: file.type, purpose: 'portal_upload' }),
})
const { uploadUrl, key } = await res.json()

// 2. Upload directly to S3
if (!uploadUrl.startsWith('data:')) {
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
}

// 3. File is now in S3 and recorded in asher_uploaded_files
```

### Anti-Patterns to Avoid
- **Fetching patient data by email lookup:** Portal auth provides `asherPatientId` directly in the JWT. Use `getPatientById(asherPatientId)` -- do NOT replicate the old `/api/member/profile` pattern of querying `pending_intakes` by email.
- **Allowing edit of personal info fields:** PROF-01 and PROF-04 are read-only. Only PROF-03 (shipping address) is editable. Do not build edit UIs for name, DOB, phone, email, gender, or measurements.
- **Using the old `cultr_session` cookie:** Portal pages MUST use `verifyPortalAuth()` / `cultr_portal_access` cookie. The old magic-link session is a completely separate auth flow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| S3 file upload | Direct S3 SDK integration | `getPresignedUploadUrl()` from `asher-med-api.ts` | Asher Med manages S3 bucket, presigned URLs handle auth |
| S3 file preview | Direct S3 SDK integration | `getPreviewUrl(key)` from `asher-med-api.ts` | Returns temporary signed URL for viewing |
| Patient data lookup | Custom DB query by email | `getPatientById(asherPatientId)` from `asher-med-api.ts` | Asher Med is source of truth for patient data |
| Patient address update | Custom DB update | `updatePatient(patientId, data)` from `asher-med-api.ts` | Must sync to Asher Med; local DB is not authoritative |
| US state validation | Custom state list | `US_STATES` from `lib/config/asher-med.ts` | Already exists with code + name pairs |
| Portal auth verification | Custom JWT parsing | `verifyPortalAuth(request)` from `lib/portal-auth.ts` | Established pattern from Phase 1 |

**Key insight:** Asher Med is the source of truth for all patient data. The portal reads from and writes to Asher Med. Local DB (`asher_uploaded_files`) is only used for indexing uploaded documents by patient, since Asher Med doesn't expose a "list documents for patient" endpoint.

## Common Pitfalls

### Pitfall 1: Missing asherPatientId (Case C users)
**What goes wrong:** A user with a verified phone but no Asher Med patient record (never completed intake) tries to view their profile. `getPatientById(null)` will throw.
**Why it happens:** Phase 1 established three cases: (A) patient found, (B) known phone/no patient, (C) never-seen phone. Case B and C have `asherPatientId: null`.
**How to avoid:** Check for `null` asherPatientId early and return an appropriate empty state with a CTA to complete intake, matching the dashboard empty state pattern.
**Warning signs:** 500 errors on profile page for new/incomplete users.

### Pitfall 2: S3 Preview URL Expiration
**What goes wrong:** Preview URLs from `getPreviewUrl()` are presigned and expire (typically 15 minutes to 1 hour). If a user opens the documents page and comes back hours later, the URLs will be stale.
**Why it happens:** S3 presigned URLs are time-limited by design.
**How to avoid:** Generate preview URLs on each page load (not cached). If rendering images inline, use `<img>` tags with the preview URL as src -- the browser will fetch immediately. For "View" buttons, fetch a fresh preview URL on click rather than storing it.
**Warning signs:** Broken images or 403 errors on document thumbnails after page sits idle.

### Pitfall 3: asher_uploaded_files Table Has No Data
**What goes wrong:** The `asher_uploaded_files` table exists but no code writes to it. The GET endpoint for documents will return an empty list for all users, even those who uploaded ID and consent during intake.
**Why it happens:** Migration 008 created the table, but the intake upload route (`/api/intake/upload`) only gets presigned URLs without recording in the DB.
**How to avoid:** Two-pronged approach: (1) Portal document upload (DOCS-02) writes to `asher_uploaded_files`. (2) Modify the intake upload route to also write to `asher_uploaded_files` so future intakes populate the table. Historical data can be backfilled later if needed.
**Warning signs:** Documents page shows empty for users who already completed intake.

### Pitfall 4: Asher Med API Errors on Profile Page
**What goes wrong:** If Asher Med API is down, the entire profile page shows an error.
**Why it happens:** Profile data comes from Asher Med; there's no local fallback for patient demographics.
**How to avoid:** Follow the Phase 2 pattern: catch Asher Med errors and return 502 with a user-friendly error message and retry button. For profile specifically, consider a best-effort local fallback from `portal_sessions` (has first_name, last_name) and `pending_intakes.intake_data` (has address from form submission).
**Warning signs:** Profile page showing errors when Asher Med has intermittent issues.

### Pitfall 5: Address Field Name Mismatch
**What goes wrong:** Asher Med uses `stateAbbreviation` and `zipcode` (no capital C) while the intake form uses `state` and `zipCode` (capital C). PUT requests fail or silently drop fields.
**Why it happens:** Inconsistent naming between Asher Med API and local form data models.
**How to avoid:** The `updatePatient()` function in `asher-med-api.ts` accepts the Asher Med field names. Map form field names to API field names explicitly in the PUT handler. Reference the existing `/api/member/profile` PUT handler which already does this mapping.
**Warning signs:** Address updates appear to succeed but don't actually change in Asher Med.

### Pitfall 6: Duplicate Upload Records
**What goes wrong:** User uploads the same file twice, creating duplicate entries in `asher_uploaded_files`.
**Why it happens:** Each upload gets a unique S3 key (UUID-based), so there's no natural dedup.
**How to avoid:** This is acceptable behavior -- each upload is a distinct S3 object. Display documents in upload order (newest first). Do not attempt to deduplicate.

## Code Examples

### Portal Profile API Route (GET) -- Recommended Shape
```typescript
// Source: pattern derived from existing app/api/portal/orders/route.ts + app/api/member/profile/route.ts
export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (!auth.asherPatientId) {
    return NextResponse.json({ success: true, profile: null })
  }
  try {
    const patient = await getPatientById(auth.asherPatientId)
    return NextResponse.json({
      success: true,
      profile: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phoneNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: {
          address1: patient.address1 || '',
          address2: patient.address2 || '',
          city: patient.city || '',
          state: patient.stateAbbreviation || '',
          zipCode: patient.zipcode || '',
        },
        measurements: {
          height: patient.height || null,    // inches
          weight: patient.weight || null,    // lbs
          bmi: patient.bmi || null,
        },
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load profile' },
      { status: 502 }
    )
  }
}
```

### Portal Profile API Route (PUT) -- Address Update
```typescript
// Source: pattern derived from existing app/api/member/profile/route.ts PUT handler
export async function PUT(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const body = await request.json()
  const { address } = body

  // Validate address fields with Zod
  // ...

  await updatePatient(auth.asherPatientId, {
    address1: address.address1,
    address2: address.address2 || null,
    city: address.city,
    stateAbbreviation: address.state,
    zipcode: address.zipCode,
    country: 'US',
  })
  return NextResponse.json({ success: true })
}
```

### Portal Documents API Route (GET) -- Document List
```typescript
// Source: pattern derived from existing app/api/member/files/route.ts
export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Query asher_uploaded_files by asher_patient_id (not email)
  const result = await sql`
    SELECT id, s3_key, content_type, file_purpose, uploaded_at
    FROM asher_uploaded_files
    WHERE asher_patient_id = ${auth.asherPatientId}
    ORDER BY uploaded_at DESC
  `

  // Generate preview URLs (best-effort per file)
  const documents = await Promise.all(
    result.rows.map(async (row) => {
      let previewUrl = null
      try {
        const response = await getPreviewUrl(row.s3_key)
        previewUrl = response.data.previewUrl
      } catch { /* preview unavailable */ }
      return {
        id: row.id,
        purpose: row.file_purpose,
        contentType: row.content_type,
        previewUrl,
        uploadedAt: row.uploaded_at,
      }
    })
  )

  return NextResponse.json({ success: true, documents })
}
```

### Document Upload (POST) -- with DB Recording
```typescript
// Source: pattern derived from existing app/api/intake/upload/route.ts
export async function POST(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { contentType, purpose } = await request.json()
  // Validate contentType and purpose...

  const presignedData = await getPresignedUploadUrl(contentType)

  // Record in local DB for later retrieval
  await sql`
    INSERT INTO asher_uploaded_files (s3_key, content_type, file_purpose, asher_patient_id, uploaded_at)
    VALUES (${presignedData.data.key}, ${contentType}, ${purpose}, ${auth.asherPatientId}, NOW())
  `

  return NextResponse.json({
    success: true,
    uploadUrl: presignedData.data.uploadUrl,
    key: presignedData.data.key,
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Magic-link email auth (`cultr_session`) | Phone OTP auth (`cultr_portal_access`) | Phase 1 (2026-03-11) | Portal routes MUST use `verifyPortalAuth()` |
| Patient lookup by email via `pending_intakes` | Direct lookup by `asherPatientId` from JWT | Phase 2 (2026-03-11) | No email-based queries in portal routes |
| Old `/api/member/*` routes | New `/api/portal/*` routes | Phase 2 (2026-03-11) | Old routes remain for backwards compat; portal uses new routes |

**Not deprecated but not for portal use:**
- `/api/member/profile` -- uses `cultr_session` cookie, email-based lookup. Keep for legacy member pages.
- `/api/member/files` -- uses `cultr_session` cookie. Keep for legacy member pages.

## DB Schema Notes

### asher_uploaded_files (Migration 008 -- already exists)
```sql
CREATE TABLE asher_uploaded_files (
  id SERIAL PRIMARY KEY,
  s3_key VARCHAR(500) UNIQUE NOT NULL,
  content_type VARCHAR(100),
  file_purpose VARCHAR(100),      -- 'id_document', 'telehealth_signature', etc.
  customer_email VARCHAR(255),
  intake_session_id INTEGER REFERENCES intake_form_sessions(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### Required Schema Change
The `asher_uploaded_files` table needs an `asher_patient_id` column to support portal-auth lookups (portal auth identifies by patient ID, not email). This requires a new migration.

```sql
-- Migration 019: Add asher_patient_id to asher_uploaded_files
ALTER TABLE asher_uploaded_files
  ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_uploaded_files_patient_id
  ON asher_uploaded_files(asher_patient_id);
```

### AsherPatient Interface (from asher-med-api.ts)
Fields available for profile display:
```typescript
interface AsherPatient {
  id: number
  firstName: string          // PROF-01
  lastName: string           // PROF-01
  email: string              // PROF-01
  phoneNumber: string        // PROF-01
  dateOfBirth: string        // PROF-01
  gender: AsherGender        // PROF-01 ('MALE' | 'FEMALE')
  status: AsherPatientStatus
  address1?: string          // PROF-02, PROF-03
  address2?: string | null   // PROF-02, PROF-03
  city?: string              // PROF-02, PROF-03
  stateAbbreviation?: string // PROF-02, PROF-03
  zipcode?: string           // PROF-02, PROF-03
  country?: string           // PROF-02, PROF-03
  apartmentNumber?: string   // PROF-02, PROF-03
  height?: number            // PROF-04 (inches)
  weight?: number            // PROF-04 (lbs)
  bmi?: number               // PROF-04
  currentBodyFat?: number    // PROF-04
}
```

### updatePatient Field Names (for PROF-03 address sync)
```typescript
// PUT /api/v1/external/partner/patients/{id}
updatePatient(patientId, {
  address1: string,
  address2: string | null,
  city: string,
  stateAbbreviation: string,  // Note: NOT 'state'
  zipcode: string,            // Note: NOT 'zipCode' (no capital C)
  country: string,
  apartmentNumber?: string,
})
```

## Open Questions

1. **Historical document backfill**
   - What we know: `asher_uploaded_files` is empty. Intake upload route doesn't write to it. S3 keys were sent to Asher Med in the order request but not stored locally.
   - What's unclear: Whether it's worth writing a migration script to extract S3 keys from `pending_intakes.intake_data` JSONB to backfill the table.
   - Recommendation: Defer backfill. Start recording from now on. Existing users can re-upload if needed. The S3 keys may not even be in the `intake_data` JSONB (they're sent in the Asher Med request body, not stored locally).

2. **Document purpose labels for portal uploads**
   - What we know: Intake uploads have structured purposes: `id_document`, `telehealth_signature`, `compounded_consent`, `prescription_photo`.
   - What's unclear: What categories portal uploads should use. Users may want to upload updated IDs, new prescriptions, or miscellaneous medical records.
   - Recommendation: Use a simple dropdown: "Government ID", "Prescription", "Lab Results", "Other". Map to `file_purpose` values like `portal_id`, `portal_prescription`, `portal_lab_results`, `portal_other`.

3. **File size and type limits for portal uploads**
   - What we know: Intake upload allows image types + PDF, max 10MB.
   - Recommendation: Use the same limits. Same `allowedContentTypes` list from intake upload route.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

**Note:** Test suite currently fails to run due to missing `@testing-library/dom` peer dependency (`npm install @testing-library/dom` needed). This is a pre-existing issue unrelated to Phase 3.

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile GET returns personal info from Asher Med | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns personal info"` | Wave 0 |
| PROF-02 | Profile GET returns shipping address | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns address"` | Wave 0 |
| PROF-03 | Profile PUT updates address in Asher Med | unit | `npx vitest run tests/api/portal-profile.test.ts -t "updates address"` | Wave 0 |
| PROF-04 | Profile GET returns measurements | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns measurements"` | Wave 0 |
| DOCS-01 | Documents GET lists files with preview URLs | unit | `npx vitest run tests/api/portal-documents.test.ts -t "lists documents"` | Wave 0 |
| DOCS-02 | Documents POST returns presigned URL and records in DB | unit | `npx vitest run tests/api/portal-documents.test.ts -t "upload"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/api/portal-profile.test.ts tests/api/portal-documents.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/api/portal-profile.test.ts` -- covers PROF-01 through PROF-04
- [ ] `tests/api/portal-documents.test.ts` -- covers DOCS-01, DOCS-02
- [ ] Fix `@testing-library/dom` missing peer dependency: `npm install -D @testing-library/dom`

## Sources

### Primary (HIGH confidence)
- `lib/asher-med-api.ts` -- Full Asher Med API client with typed interfaces for patients, orders, uploads, preview URLs
- `app/api/portal/orders/route.ts` -- Established portal API route pattern (auth, patient check, Asher Med proxy, error handling)
- `app/portal/dashboard/DashboardClient.tsx` -- Established portal client page pattern (fetch-on-mount, loading/error states, design language)
- `lib/portal-auth.ts` -- Portal authentication functions (verifyPortalAuth, cookie management)
- `lib/portal-db.ts` -- Portal DB operations (session lookup by phone)
- `migrations/008_asher_med_tables.sql` -- DB schema for asher_uploaded_files table
- `app/api/member/profile/route.ts` -- Existing member profile route (old auth, reference for Asher Med data shape)
- `app/api/member/files/route.ts` -- Existing member files route (old auth, reference for document listing pattern)
- `components/intake/IDUploader.tsx` -- Existing file upload UX pattern (drag-drop, preview, error states)
- `app/api/intake/upload/route.ts` -- Existing presigned URL flow (validation, mock mode for staging)

### Secondary (MEDIUM confidence)
- `app/api/intake/submit/route.ts` -- Confirmed S3 keys sent to Asher Med but NOT stored in asher_uploaded_files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all libraries already in use
- Architecture: HIGH -- follows established Phase 1/2 patterns exactly
- Pitfalls: HIGH -- identified from direct code analysis of existing routes and DB schema
- Document management gap: HIGH -- confirmed via grep that asher_uploaded_files has zero INSERT paths

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable internal codebase, no external API changes expected)
