import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use, EULA & Privacy Policy — CULTR Health QuickBooks Integration',
  description: 'Terms of use, end-user license agreement, and privacy policy for the CULTR Health QuickBooks Online integration application.',
};

export default function QuickBooksTermsPage() {
  return (
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Legal</h1>
          <p className="text-white/70 mt-3 text-lg"><span className="font-display font-bold">CULTR</span> Health — QuickBooks Online Integration</p>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-6 px-6 border-b border-cultr-forest/10 bg-brand-cream sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 text-sm">
          <a href="#terms" className="text-brand-primary font-medium hover:underline">Terms of Use</a>
          <span className="text-cultr-textMuted">/</span>
          <a href="#eula" className="text-brand-primary font-medium hover:underline">End-User License Agreement</a>
          <span className="text-cultr-textMuted">/</span>
          <a href="#privacy" className="text-brand-primary font-medium hover:underline">Privacy Policy</a>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-cultr-textMuted mb-12">Last updated: February 26, 2026</p>

          {/* ============================================================ */}
          {/* TERMS OF USE */}
          {/* ============================================================ */}
          <div id="terms" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-brand-primary rounded-full" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest">Terms of Use</h2>
            </div>

            <div className="prose prose-cultr max-w-none">
              <p className="text-cultr-text leading-relaxed">
                These Terms of Use (&quot;Terms&quot;) govern your use of the <span className="font-display font-bold">CULTR</span> Health QuickBooks Online integration application (&quot;App&quot;), operated by CULTR Health (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By connecting your QuickBooks Online account to our App, you agree to be bound by these Terms.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. Description of the App</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The <span className="font-display font-bold">CULTR</span> Health QuickBooks integration connects our internal order management system with QuickBooks Online to automate accounting workflows. The App performs the following functions:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Creates and manages customer records in QuickBooks Online based on approved club orders</li>
                <li>Generates invoices in QuickBooks Online for approved CULTR Club orders</li>
                <li>Sends invoices to customers via QuickBooks Online&apos;s email delivery system</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. QuickBooks Online Account Access</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                To use the App, you must authorize it to access your QuickBooks Online company account via Intuit&apos;s OAuth 2.0 authorization flow. By authorizing the App, you grant us permission to:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Read and write customer data in your QuickBooks Online account</li>
                <li>Create, read, and send invoices in your QuickBooks Online account</li>
                <li>Query existing records to prevent duplicate entries</li>
              </ul>
              <p className="text-cultr-textMuted leading-relaxed mt-3">
                You may revoke this access at any time through your QuickBooks Online account settings or by contacting us directly. Revoking access will stop all future automated interactions between the App and your QuickBooks Online account.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. User Responsibilities</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                As a user of this App, you agree to:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Maintain the security of your QuickBooks Online account credentials</li>
                <li>Ensure you have the authority to grant the App access to the QuickBooks Online company account</li>
                <li>Review invoices generated by the App for accuracy before they are sent to customers</li>
                <li>Comply with all applicable laws and regulations, including tax and accounting requirements</li>
                <li>Notify us promptly of any unauthorized use of the App or security concerns</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Accuracy of Data</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                While we strive to ensure that data transmitted to QuickBooks Online is accurate, you are ultimately responsible for verifying the accuracy of all invoices, customer records, and financial data created through the App. We recommend reviewing records in QuickBooks Online regularly.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. Service Availability</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App depends on the availability of both the <span className="font-display font-bold">CULTR</span> Health platform and QuickBooks Online APIs. We do not guarantee uninterrupted access to the App. The App may be temporarily unavailable due to scheduled or unscheduled maintenance, QuickBooks Online API outages or changes, or network and infrastructure issues. If the QuickBooks integration is temporarily unavailable, orders will continue to be processed through our platform and invoices can be created manually at a later time.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Limitation of Liability</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CULTR HEALTH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP, INCLUDING BUT NOT LIMITED TO ERRORS IN INVOICES OR CUSTOMER RECORDS, LOSS OF DATA OR BUSINESS INTERRUPTION, UNAUTHORIZED ACCESS TO YOUR QUICKBOOKS ACCOUNT, OR CHANGES TO THE QUICKBOOKS ONLINE API THAT AFFECT FUNCTIONALITY. Our total liability for any claim shall not exceed $100.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">7. Disclaimer of Warranties</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">8. Intuit Disclaimer</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                This App is not endorsed, certified, or approved by Intuit Inc. QuickBooks, QuickBooks Online, and the QuickBooks logo are trademarks of Intuit Inc., used with permission. The App uses Intuit&apos;s APIs in accordance with Intuit&apos;s developer terms and policies.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">9. Termination</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We reserve the right to suspend or terminate access to the App at any time, with or without cause, and with or without notice. You may stop using the App at any time by revoking its access to your QuickBooks Online account. Upon termination, all rights granted to us to access your QuickBooks Online account will cease, cached access tokens will be invalidated, and previously created invoices and customer records in QuickBooks Online will remain in your account.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">10. Changes to These Terms</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We may update these Terms from time to time. If we make material changes, we will notify you by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of the App after changes are posted constitutes acceptance of the revised Terms.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">11. Governing Law</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in Florida.
              </p>
            </div>
          </div>

          <hr className="my-16 border-cultr-forest/10" />

          {/* ============================================================ */}
          {/* END-USER LICENSE AGREEMENT */}
          {/* ============================================================ */}
          <div id="eula" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-brand-primary rounded-full" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest">End-User License Agreement</h2>
            </div>

            <div className="prose prose-cultr max-w-none">
              <p className="text-cultr-text leading-relaxed">
                This End-User License Agreement (&quot;EULA&quot;) is a legal agreement between you (&quot;User&quot; or &quot;you&quot;) and CULTR Health (&quot;Licensor,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) for the use of the <span className="font-display font-bold">CULTR</span> Health QuickBooks Online integration application (&quot;App&quot;). By installing, accessing, or using the App, you agree to be bound by the terms of this EULA.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. License Grant</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                Subject to the terms of this EULA, we grant you a limited, non-exclusive, non-transferable, revocable license to use the App solely for the purpose of integrating your QuickBooks Online account with the <span className="font-display font-bold">CULTR</span> Health platform for internal business operations. This license does not include the right to:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Modify, adapt, translate, reverse engineer, decompile, or disassemble the App</li>
                <li>Create derivative works based on the App</li>
                <li>Distribute, sublicense, lease, rent, or lend the App to any third party</li>
                <li>Remove or alter any proprietary notices, labels, or marks on the App</li>
                <li>Use the App for any unlawful purpose or in violation of any applicable laws or regulations</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. Intellectual Property</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App and all copies thereof are proprietary to CULTR Health and title, ownership rights, and intellectual property rights in the App shall remain with CULTR Health. The App is protected by copyright laws and international treaty provisions. You acknowledge that no title to the intellectual property in the App is transferred to you. You further acknowledge that title and full ownership rights to the App will remain the exclusive property of CULTR Health, and you will not acquire any rights to the App except as expressly set forth in this EULA.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. Third-Party Services</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App integrates with QuickBooks Online, a third-party service provided by Intuit Inc. Your use of QuickBooks Online is governed by Intuit&apos;s own terms of service and privacy policy. We are not responsible for the availability, accuracy, or reliability of QuickBooks Online or any data processed through it. You acknowledge that:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Intuit may modify or discontinue QuickBooks Online APIs at any time, which may affect App functionality</li>
                <li>You are responsible for maintaining a valid QuickBooks Online subscription</li>
                <li>We have no control over Intuit&apos;s data handling practices</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Data Ownership</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                You retain all ownership rights to your data. We do not claim any ownership interest in your QuickBooks Online data, customer information, or financial records. The App processes your data solely to provide the integration services described herein. Any data created in your QuickBooks Online account through the App (including customer records and invoices) belongs to you and remains in your QuickBooks Online account even after the App is disconnected.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. Support and Updates</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We may, at our sole discretion, provide updates, bug fixes, or new features for the App. Such updates may be applied automatically. We are not obligated to provide technical support, maintenance, or updates for the App. If support is provided, it will be subject to our then-current support policies.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Disclaimer of Warranties</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">7. Limitation of Liability</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                IN NO EVENT SHALL CULTR HEALTH BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OF OR INABILITY TO USE THE APP, EVEN IF CULTR HEALTH HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN ANY CASE, OUR ENTIRE LIABILITY UNDER ANY PROVISION OF THIS EULA SHALL BE LIMITED TO THE AMOUNT ACTUALLY PAID BY YOU FOR THE APP, OR $100, WHICHEVER IS GREATER.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">8. Indemnification</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                You agree to indemnify, defend, and hold harmless CULTR Health, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to your use of the App, your violation of this EULA, or your violation of any rights of a third party.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">9. Term and Termination</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                This EULA is effective until terminated. We may terminate this EULA at any time if you fail to comply with any term of this agreement. Upon termination, you must cease all use of the App and disconnect it from your QuickBooks Online account. Sections 2, 4, 6, 7, 8, and 11 shall survive any termination of this EULA.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">10. Export Compliance</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                You agree to comply with all applicable export and re-export control laws and regulations, including the Export Administration Regulations maintained by the U.S. Department of Commerce, trade and economic sanctions maintained by the Treasury Department&apos;s Office of Foreign Assets Control, and the International Traffic in Arms Regulations maintained by the Department of State.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">11. Governing Law</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                This EULA shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any legal action or proceeding arising under this EULA shall be brought exclusively in the state or federal courts located in Florida, and you hereby consent to the personal jurisdiction and venue therein.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">12. Entire Agreement</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                This EULA, together with the Terms of Use and Privacy Policy on this page, constitutes the entire agreement between you and CULTR Health regarding the App and supersedes all prior or contemporaneous understandings, whether written or oral. No amendment to or modification of this EULA will be binding unless in writing and signed by CULTR Health.
              </p>
            </div>
          </div>

          <hr className="my-16 border-cultr-forest/10" />

          {/* ============================================================ */}
          {/* PRIVACY POLICY */}
          {/* ============================================================ */}
          <div id="privacy" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-brand-primary rounded-full" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest">Privacy Policy</h2>
            </div>

            <div className="prose prose-cultr max-w-none">
              <p className="text-cultr-text leading-relaxed">
                This Privacy Policy describes how CULTR Health (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, and protects information in connection with the <span className="font-display font-bold">CULTR</span> Health QuickBooks Online integration application (&quot;App&quot;). This policy applies specifically to data processed through the QuickBooks Online integration.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">1. Information We Collect</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App collects and processes the minimum data necessary to provide its integration services:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Customer information:</strong> Names and email addresses of customers associated with approved CULTR Club orders, used to create or match customer records in QuickBooks Online.</li>
                <li><strong>Order information:</strong> Item names, descriptions, quantities, unit prices, order numbers, and order dates for approved orders, used to generate invoices in QuickBooks Online.</li>
                <li><strong>QuickBooks account information:</strong> Your QuickBooks Online company ID (Realm ID) and OAuth 2.0 tokens (access token and refresh token) to authenticate and communicate with the QuickBooks Online API.</li>
              </ul>
              <p className="text-cultr-textMuted leading-relaxed mt-3">
                We do <strong>not</strong> collect or access:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li>Your QuickBooks Online login credentials (username or password)</li>
                <li>Bank account or payment card information stored in QuickBooks Online</li>
                <li>Tax returns, payroll data, or other financial records beyond invoices we create</li>
                <li>Data from other QuickBooks Online apps or integrations</li>
                <li>Protected Health Information (PHI) — the App handles only order and billing data, not medical records</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">2. How We Use Your Information</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We use the collected information solely for the following purposes:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Customer record management:</strong> To create new customer records or match existing ones in your QuickBooks Online account, preventing duplicate entries.</li>
                <li><strong>Invoice generation:</strong> To create accurate invoices in QuickBooks Online reflecting approved CULTR Club orders.</li>
                <li><strong>Invoice delivery:</strong> To send generated invoices to customers via QuickBooks Online&apos;s built-in email system.</li>
                <li><strong>Authentication:</strong> To maintain a valid connection between the App and your QuickBooks Online account using OAuth 2.0 tokens.</li>
                <li><strong>Error logging:</strong> To log error messages (without sensitive data) for troubleshooting integration issues.</li>
              </ul>
              <p className="text-cultr-textMuted leading-relaxed mt-3">
                We do <strong>not</strong> use your QuickBooks data for advertising, marketing, analytics, profiling, or any purpose other than providing the integration services described above.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">3. Data Storage and Security</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We implement the following security measures to protect your data:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Encryption in transit:</strong> All data transmitted between the App and QuickBooks Online is encrypted using HTTPS/TLS.</li>
                <li><strong>Token management:</strong> OAuth access tokens are cached in application memory only for the duration of their validity (typically 1 hour). They are not written to disk or databases. Refresh tokens are stored as encrypted environment variables in our hosting infrastructure (Vercel) and are never exposed to end users or client-side code.</li>
                <li><strong>No persistent data storage:</strong> The App does not maintain its own database of QuickBooks data. Customer and invoice data is transmitted directly to QuickBooks Online and is not stored by the App after the API call completes.</li>
                <li><strong>Access control:</strong> Only authorized CULTR Health administrators with access to the App&apos;s hosting environment can view or manage OAuth credentials.</li>
                <li><strong>Infrastructure security:</strong> The App is hosted on Vercel, which maintains SOC 2 Type 2 compliance and provides infrastructure-level encryption at rest.</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">4. Data Sharing and Disclosure</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We do <strong>not</strong> sell, rent, trade, or otherwise share your QuickBooks data with third parties, except in the following limited circumstances:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Intuit / QuickBooks Online:</strong> Data is transmitted to Intuit&apos;s QuickBooks Online API to perform the App&apos;s core functions. This data transfer is governed by Intuit&apos;s privacy policy and developer agreement.</li>
                <li><strong>Legal requirements:</strong> We may disclose data if required to do so by law, regulation, legal process, or governmental request.</li>
                <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction, and we will notify you of any such change.</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">5. Data Retention</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App does not maintain a persistent store of your QuickBooks data. Specifically:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Access tokens:</strong> Cached in memory for up to 1 hour (the token&apos;s validity period), then discarded.</li>
                <li><strong>Refresh tokens:</strong> Stored as environment variables for the duration of the integration connection. Deleted upon disconnection or revocation.</li>
                <li><strong>Customer and invoice data:</strong> Transmitted to QuickBooks Online in real-time and not retained by the App.</li>
                <li><strong>Error logs:</strong> Application logs may contain non-sensitive metadata (timestamps, error codes, order numbers) and are retained for up to 30 days for troubleshooting purposes.</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">6. Your Rights and Choices</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                You have the following rights regarding your data:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-disc pl-6 space-y-2 mt-3">
                <li><strong>Disconnect:</strong> You may revoke the App&apos;s access to your QuickBooks Online account at any time through your QuickBooks Online settings (Apps &gt; My Apps) or by contacting us.</li>
                <li><strong>Access:</strong> You may request a summary of what data the App has accessed in your QuickBooks Online account.</li>
                <li><strong>Deletion:</strong> Since the App does not persistently store your QuickBooks data, there is no App-side data to delete. Data created in your QuickBooks Online account (invoices, customers) is managed by you within QuickBooks Online.</li>
                <li><strong>Portability:</strong> Your data resides in your QuickBooks Online account and can be exported using QuickBooks Online&apos;s built-in export features.</li>
              </ul>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">7. Children&apos;s Privacy</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App is intended for use by businesses and individuals who are at least 18 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected information from a child under 13, we will take steps to delete that information promptly.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">8. California Privacy Rights</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA). We do not sell personal information. You may contact us to exercise your rights to know, delete, or opt out as applicable under the CCPA.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">9. International Data Transfers</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                The App is operated from the United States. If you are accessing the App from outside the United States, please be aware that your data may be transferred to, stored, and processed in the United States where our servers and hosting infrastructure are located.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">10. Changes to This Privacy Policy</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                We may update this Privacy Policy from time to time. If we make material changes, we will update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this Privacy Policy periodically. Your continued use of the App after changes are posted constitutes your acceptance of the revised policy.
              </p>

              <h3 className="text-xl font-display font-bold text-cultr-forest mt-10 mb-4">11. Contact Us</h3>
              <p className="text-cultr-textMuted leading-relaxed">
                If you have questions about this Privacy Policy, your data, or the App, please contact us:
              </p>
              <ul className="text-cultr-textMuted leading-relaxed list-none pl-0 space-y-1 mt-3">
                <li><strong>CULTR Health</strong></li>
                <li>Email: <a href="mailto:support@cultrhealth.com" className="text-brand-primary hover:underline">support@cultrhealth.com</a></li>
                <li>Website: <a href="https://cultrhealth.com" className="text-brand-primary hover:underline">https://cultrhealth.com</a></li>
              </ul>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
