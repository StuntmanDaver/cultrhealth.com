import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getPresignedUploadUrl, getPreviewUrl } from '@/lib/asher-med-api'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

const allowedContentTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]

const allowedPurposes = [
  'portal_id',
  'portal_prescription',
  'portal_lab_results',
  'portal_other',
]

/**
 * GET /api/portal/documents
 *
 * Lists uploaded documents for the authenticated member.
 * Generates fresh preview URLs for each document on every request.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!auth.asherPatientId) {
    return NextResponse.json({ error: 'No patient record found' }, { status: 401 })
  }

  try {
    const result = await sql`
      SELECT id, s3_key, content_type, file_purpose, uploaded_at
      FROM asher_uploaded_files
      WHERE asher_patient_id = ${auth.asherPatientId}
      ORDER BY uploaded_at DESC
    `

    const documents = await Promise.all(
      result.rows.map(async (row) => {
        let previewUrl = null
        try {
          const response = await getPreviewUrl(row.s3_key)
          previewUrl = response.data.previewUrl
        } catch {
          // Preview unavailable -- return null
        }
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
  } catch (error) {
    console.error('Failed to load documents:', error)
    return NextResponse.json(
      { success: false, error: 'Unable to load documents', documents: [] },
      { status: 502 }
    )
  }
}

/**
 * POST /api/portal/documents
 *
 * Gets a presigned upload URL and records the document in the database.
 * Supports mock mode on staging when ASHER_MED_API_KEY is absent.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyPortalAuth(request)

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!auth.asherPatientId) {
    return NextResponse.json({ error: 'No patient record found' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contentType, purpose } = body

    // Validate content type
    if (!contentType || !allowedContentTypes.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid content type. Allowed types: ${allowedContentTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate purpose
    if (!purpose || !allowedPurposes.includes(purpose)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid purpose. Allowed purposes: ${allowedPurposes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Mock mode when no ASHER_MED_API_KEY on staging/dev
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const isStaging = siteUrl.includes('staging')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const shouldMock = !process.env.ASHER_MED_API_KEY && (isDevelopment || isStaging)

    if (shouldMock) {
      const mockKey = `mock/portal/${purpose}/${Date.now()}-${Math.random().toString(36).substring(7)}`

      console.log('Mock portal upload (no ASHER_MED_API_KEY):', {
        purpose,
        contentType,
        mockKey,
        environment: isStaging ? 'staging' : 'development',
      })

      // Record in DB even for mock uploads
      await sql`
        INSERT INTO asher_uploaded_files (s3_key, content_type, file_purpose, asher_patient_id, uploaded_at)
        VALUES (${mockKey}, ${contentType}, ${purpose}, ${auth.asherPatientId}, NOW())
      `

      return NextResponse.json({
        success: true,
        uploadUrl: 'data:text/plain;base64,bW9ja191cGxvYWQ=',
        key: mockKey,
      })
    }

    // Production: get presigned URL from Asher Med
    const presignedData = await getPresignedUploadUrl(contentType)

    // Record in local DB for portal document listing
    await sql`
      INSERT INTO asher_uploaded_files (s3_key, content_type, file_purpose, asher_patient_id, uploaded_at)
      VALUES (${presignedData.data.key}, ${contentType}, ${purpose}, ${auth.asherPatientId}, NOW())
    `

    console.log('Portal document upload:', {
      purpose,
      contentType,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      uploadUrl: presignedData.data.uploadUrl,
      key: presignedData.data.key,
    })
  } catch (error) {
    console.error('Failed to process document upload:', error)
    return NextResponse.json(
      { success: false, error: 'Unable to process upload' },
      { status: 502 }
    )
  }
}
