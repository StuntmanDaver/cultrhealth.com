# Quick Test Guide: Email Flow Reliability

## Test Setup

Before testing, ensure these env vars are set in Vercel staging:
- `RESEND_API_KEY` ✅ Set and valid
- `FROM_EMAIL` = david@cultrhealth.com
- `ADMIN_APPROVAL_EMAIL` = admin@cultrhealth.com (or your test email)
- `POSTGRES_URL` ✅ Connected (for order storage)
- `JWT_SECRET` ✅ Set

---

## Test 1: Happy Path (Both Emails Send)

**Steps:**
1. Open staging.cultrhealth.com/join
2. Fill signup: Name, Email, (optional Phone)
3. Add items to cart (e.g., R3TA, NAD+)
4. Click "Submit Order Request"

**Expected Result:**
- ✅ Green success banner appears at top
- ✅ Response includes: `{ success: true, customerEmailSent: true, adminEmailSent: true }`
- ✅ Customer receives "Order Received — CLB-..." email
- ✅ Admin receives "New Club Order — CLB-..." email with **"Approve This Order"** button
- ✅ Vercel logs show: `[club/orders] Both emails sent successfully for CLB-...`

**Email Verification:**
- Customer email has items table + "Awaiting Review" status
- Admin email has customer info + items table + **NEW: one-click approval button** (with styling)

---

## Test 2: Partial Failure (Customer Email Fails)

**Setup:**
1. Temporarily set `RESEND_API_KEY=invalid_key_for_testing` in Vercel Preview environment
2. Wait for preview redeploy (~2 min)

**Steps:**
1. Open staging.cultrhealth.com/join
2. Submit order (same as Test 1)

**Expected Result:**
- ✅ Order still creates successfully (no visual difference to user)
- ✅ Response includes: `{ success: true, customerEmailSent: false, adminEmailSent: true }`
- ✅ Vercel logs show: `[club/orders] Customer confirmation email failed: RESEND_API_KEY not configured...`
- ✅ Vercel logs show: `[club/orders] Admin approval request email sent successfully...`
- ✅ Admin receives email (customer doesn't)
- ✅ Logs show: `[club/orders] Partial email failure for CLB-... { customerEmailSent: false, adminEmailSent: true }`

**Restore:**
1. Set `RESEND_API_KEY` back to correct value
2. Redeploy preview
3. Re-run Test 1 to confirm both emails work again

---

## Test 3: One-Click Approval (NEW!)

**Setup:**
- Complete Test 1 (happy path)
- Admin should have received email with approval button

**Steps:**
1. Open admin email
2. Look for **"Approve This Order"** button (green with brand color #2A4542)
3. Click the button directly from email

**Expected Result:**
- ✅ Browser opens to: `https://staging.cultrhealth.com/api/admin/club-orders/{orderId}/approve?token={approvalToken}`
- ✅ Page redirects to: `/admin/club-orders?approved=CLB-...`
- ✅ Admin can see order marked as "approved" in the list
- ✅ Customer receives: "Your Order is Confirmed — CLB-..." email
- ✅ Vercel logs show: `[club-orders/approve] Approval emails sent for CLB-...`

**Fallback Test:**
1. If email button doesn't work, test fallback link: "view all orders in the admin panel"
2. Should navigate to `/admin/club-orders`
3. Manual approval should work as before

---

## Test 4: Error Visibility in Response

**Steps:**
1. Open browser DevTools → Network tab
2. Submit order from staging.cultrhealth.com/join
3. Look for request to `/api/club/orders` (POST)
4. View Response tab

**Expected Result:**
- Response JSON includes flags: `customerEmailSent` and `adminEmailSent`
- Both should be `true` (unless you're testing a failure scenario)
- Example response:
```json
{
  "success": true,
  "orderNumber": "CLB-1F4QJ5H-A1B2",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customerEmailSent": true,
  "adminEmailSent": true
}
```

---

## Test 5: Vercel Function Logs

**Steps:**
1. Log into Vercel dashboard
2. Navigate to CULTR Health project → Deployments → select staging deployment
3. Click "Functions" tab
4. Find `/api/club/orders` function
5. Look at recent invocations

**Expected Logs:**
```
[club/orders] Both emails sent successfully for CLB-1F4QJ5H-A1B2
```

Or (if testing partial failure):
```
[club/orders] Customer confirmation email failed: ...
[club/orders] Admin approval request email sent successfully
[club/orders] Partial email failure for CLB-1F4QJ5H-A1B2 { customerEmailSent: false, adminEmailSent: true }
```

---

## Checklist

- [ ] Test 1: Happy path (both emails send)
- [ ] Test 2: Partial failure (customer email fails, admin still sends)
- [ ] Test 3: One-click approval button works
- [ ] Test 4: Response includes email delivery flags
- [ ] Test 5: Vercel logs show clear messaging

---

## Rollback Instructions

If issues are found, rollback is simple:
```bash
git revert HEAD~1  # Reverts the email flow changes
git push origin staging
```

The changes are isolated to `app/api/club/orders/route.ts` and don't affect database schema or other routes.

---

## Success Criteria

✅ Both tests pass
✅ One-click approval button is clickable and properly formatted
✅ Response includes email delivery flags
✅ Vercel logs show clear error messaging (no silent failures)
✅ All tests can run 3+ times without issues
