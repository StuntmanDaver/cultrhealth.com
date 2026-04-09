import { test, expect } from '@playwright/test';
import { getConsultationBookingUrl } from '../lib/config/links';

/**
 * Extensive End-to-End Test for Healthie Availability
 * 
 * This test navigates directly to the Healthie booking embed URLs
 * to verify if appointment options are selectable and if availability populates.
 * 
 * Run with:
 * HEALTHIE_TEST_URL="your-healthie-embed-url" npx playwright test e2e/healthie-availability-diagnosis.spec.ts --headed
 */

test.describe('Healthie Consultation Booking URL Diagnosis', () => {
  test('diagnoses root cause of "No availability" when appt_type_ids are stripped', async ({ page }) => {
    // 1. Get the baseline URL from environment or use a generic structure if missing
    // To properly diagnose, you must provide the exact embed URL your org uses
    // Example: https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=123&provider_ids=[123]&appt_type_ids=[456,789]
    const rawUrl = process.env.HEALTHIE_TEST_URL || 
      'https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=13052862&provider_ids=%5B13052862%5D&appt_type_ids=%5B510493,510494%5D';
    
    // Simulate the environment for the app's link generator
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL = rawUrl;
    
    // 2. Generate the URL exactly as the application does it
    const processedUrl = getConsultationBookingUrl();
    expect(processedUrl).not.toBeNull();
    
    console.log('--- TEST URLS ---');
    console.log('Original URL (with specific appt types):', rawUrl);
    console.log('Processed URL (org_level=true, stripped appt types):', processedUrl);
    
    // 3. Test the PROCESSED URL (The one currently failing in production)
    await test.step('Check processed URL (App behavior)', async () => {
      await page.goto(processedUrl as string, { waitUntil: 'networkidle' });
      
      // Healthie uses 'No availability' text when calendars don't populate
      // We check if any appointment type container has this text
      const noAvailabilityLocators = page.locator('text=No availability');
      const count = await noAvailabilityLocators.count();
      
      console.log(`Processed URL showed "No availability" ${count} times.`);
      
      // If this is the real URL, we expect the problem to reproduce here
      if (process.env.HEALTHIE_TEST_URL) {
        expect(count, 'The processed URL is showing "No availability", confirming the bug.').toBeGreaterThan(0);
      }
    });

    // 4. Test the ORIGINAL URL (To prove that preserving appt_type_ids fixes it)
    await test.step('Check original URL (Proposed fix behavior)', async () => {
      // If we don't have a real URL to test, we can't assert on Healthie's actual live calendar
      if (!process.env.HEALTHIE_TEST_URL) {
        test.skip(true, 'No real HEALTHIE_TEST_URL provided, skipping live assertion.');
      }
      
      // But if we DO have a real URL, we navigate to the raw one that preserves appt_type_ids
      await page.goto(rawUrl, { waitUntil: 'networkidle' });
      
      const noAvailabilityLocators = page.locator('text=No availability');
      const count = await noAvailabilityLocators.count();
      
      console.log(`Original URL showed "No availability" ${count} times.`);
      
      // The original URL should NOT have the "No availability" issue
      expect(count, 'The original URL should have selectable availability.').toBe(0);
    });

    // 5. Test a hybrid URL: provider_ids stripped, but org_level=true
    // Sometimes the root cause is a mismatch between provider_ids and the org-level appointment types
    await test.step('Check hybrid URL (org_level=true, no provider filter)', async () => {
      if (!process.env.HEALTHIE_TEST_URL) return;

      const hybridUrl = new URL(rawUrl);
      hybridUrl.searchParams.set('org_level', 'true');
      
      // Strip provider filters to see if the ORG itself has availability
      const providerParamKeys = Array.from(hybridUrl.searchParams.keys()).filter((key) => 
        key.toLowerCase().startsWith('provider_ids') || key.toLowerCase() === 'dietitian_id'
      );
      for (const key of providerParamKeys) {
        hybridUrl.searchParams.delete(key);
      }
      
      await page.goto(hybridUrl.toString(), { waitUntil: 'networkidle' });
      const count = await page.locator('text=No availability').count();
      console.log(`Hybrid URL (Org-only) showed "No availability" ${count} times.`);
    });
  });
});
