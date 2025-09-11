import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Extion',
  description: 'Extion Terms of Service - Terms and conditions for using our AI Excel automation tool service.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">
            Welcome to <strong>Extion</strong> Terms of Service.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Article 1 (Purpose) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 1 (Purpose)</h2>
            <p className="text-gray-700">
              These Terms of Service (&quot;Terms&quot;) govern your use of the AI Excel automation tool service (&quot;Service&quot;) provided by Extion (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and establish the rights, obligations, responsibilities, and other necessary matters between the Company and users.
            </p>
          </section>

          {/* Article 2 (Definitions) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 2 (Definitions)</h2>
            <p className="text-gray-700 mb-4">The terms used in these Terms are defined as follows:</p>
            
            <div className="space-y-3 text-gray-700">
              <div><strong>1. &quot;Service&quot;</strong>: The Extion AI Excel automation tool and related services provided by the Company</div>
              <div><strong>2. &quot;User&quot;</strong>: Both members and non-members who use the Service in accordance with these Terms</div>
              <div><strong>3. &quot;Member&quot;</strong>: An individual who has registered by providing personal information to the Company</div>
              <div><strong>4. &quot;Natural Language Command&quot;</strong>: Excel task instructions input by users in everyday language</div>
              <div><strong>5. &quot;AI Processing&quot;</strong>: The function that analyzes natural language and automatically performs Excel tasks</div>
            </div>
          </section>

          {/* Article 3 (Effectiveness and Changes to Terms) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 3 (Effectiveness and Changes to Terms)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> These Terms are published and announced on the Service interface.</div>
              <div><strong>2.</strong> The Company may revise these Terms within the scope that does not violate applicable laws.</div>
              <div><strong>3.</strong> When Terms are changed, we will provide notice at least 7 days prior to the effective date, specifying the application date and reason for revision.</div>
              <div><strong>4.</strong> You have the right to disagree with the changed Terms, and if you do not agree, you may discontinue using the Service and terminate your account.</div>
            </div>
          </section>

          {/* Article 4 (Service Provision) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 4 (Service Provision)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Services Provided</h3>
                <p className="text-gray-700 mb-3">The Company provides the following services:</p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li><strong>Natural Language Excel Automation</strong>: Automatic execution of Excel tasks through commands like &quot;sort this&quot; or &quot;create a chart&quot;</li>
                  <li><strong>Automatic Table Organization</strong>: Data cleanup, duplicate removal, and table styling</li>
                  <li><strong>Visualization Features</strong>: Automatic generation of appropriate charts after data analysis</li>
                  <li><strong>Multi-platform Support</strong>: Support for Web, Windows, macOS, Google Sheets, and Microsoft 365</li>
                  <li><strong>Cloud Synchronization</strong>: Real-time data synchronization across all devices</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Service Hours</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>The Service is provided 24 hours a day, 365 days a year</li>
                  <li>However, the Service may be temporarily suspended for system maintenance or other reasons</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Service Fees</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>We offer both free and paid Pro versions</li>
                  <li>Pro version pricing: $9.99/month USD (beta period discount may apply)</li>
                  <li>Plan changes take effect immediately</li>
                  <li>Prices may vary by region and local currency</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Article 5 (User Obligations) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 5 (User Obligations)</h2>
            <p className="text-gray-700 mb-4">Users must not engage in the following activities:</p>
            
            <ul className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>Stealing others&apos; personal information or entering false information</li>
              <li>Modifying information posted by the Company</li>
              <li>Activities that interfere with the stable operation of the Service</li>
              <li>Interfering with other users&apos; Service usage or stealing their information</li>
              <li>Distributing computer viruses, malicious code, etc.</li>
              <li>Infringing on the Company&apos;s intellectual property rights</li>
              <li>Distributing obscene, violent, or anti-social content</li>
              <li>Attempting to create illegal or inappropriate content through natural language commands</li>
            </ul>
          </section>

          {/* Article 6 (Company Obligations) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 6 (Company Obligations)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> The Company will not engage in acts prohibited by applicable laws or these Terms or contrary to public morals, and will strive to provide continuous and stable service.</div>
              <div><strong>2.</strong> The Company establishes security systems to protect users&apos; personal information and publishes and complies with a Privacy Policy.</div>
              <div><strong>3.</strong> The Company will promptly address opinions or complaints raised by users regarding Service usage when deemed legitimate.</div>
            </div>
          </section>

          {/* Article 7 (AI Service Special Provisions) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 7 (AI Service Special Provisions)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 AI Processing Results</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>The accuracy of Excel task results generated by AI is not 100% guaranteed</li>
                  <li>We strongly recommend backing up important data before processing</li>
                  <li>Users bear final responsibility for AI processing results</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Data Processing</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Excel data entered by users is temporarily stored on servers for AI processing</li>
                  <li>Data is automatically deleted from servers after processing completion (within 24 hours maximum)</li>
                  <li>Special care is required when processing sensitive personal information or confidential data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Article 8 (Intellectual Property Rights) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 8 (Intellectual Property Rights)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> Copyrights and intellectual property rights to the Service belong to the Company.</div>
              <div><strong>2.</strong> Users may not use information obtained through the Service, to which the Company holds intellectual property rights, for commercial purposes through reproduction, transmission, publication, distribution, broadcasting, or other methods, or allow third parties to use such information, without prior consent from the Company.</div>
            </div>
          </section>

          {/* Article 9 (Limitation of Liability) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 9 (Limitation of Liability)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> The Company is exempt from liability for Service provision when unable to provide the Service due to natural disasters or equivalent force majeure events.</div>
              <div><strong>2.</strong> The Company is not liable for Service usage disruptions caused by user negligence.</div>
              <div><strong>3.</strong> The Company is not liable for loss of expected profits from Service usage or damages resulting from materials obtained through the Service.</div>
              <div><strong>4.</strong> The Company is not liable for data loss or damages resulting from AI processing results, unless there is intentional misconduct or gross negligence.</div>
              <div><strong>5.</strong> To the maximum extent permitted by applicable law, the Company&apos;s total liability shall not exceed the amount paid by the user for the Service in the 12 months preceding the claim.</div>
            </div>
          </section>

          {/* Article 10 (Dispute Resolution) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 10 (Dispute Resolution)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> The Company operates a damage compensation handling organization to reflect legitimate opinions or complaints raised by users and process compensation for damages.</div>
              <div><strong>2.</strong> For disputes arising from Service usage, the parties will first attempt to resolve disputes through good faith negotiations.</div>
              <div><strong>3.</strong> If litigation is filed regarding disputes arising from Service usage, the courts with jurisdiction over the Company&apos;s headquarters location shall have jurisdiction, subject to applicable international jurisdiction rules.</div>
            </div>
          </section>

          {/* Article 11 (Governing Law and Miscellaneous) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Article 11 (Governing Law and Miscellaneous)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> These Terms are governed by and construed in accordance with the laws of the Republic of Korea, without regard to conflict of law principles.</div>
              <div><strong>2.</strong> Matters not specified in these Terms and interpretation of these Terms shall be governed by applicable laws or commercial customs.</div>
              <div><strong>3.</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</div>
              <div><strong>4.</strong> The Company may provide localized terms or additional terms for specific regions as required by local laws.</div>
            </div>
          </section>

          {/* Supplementary Provisions */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Supplementary Provisions</h2>
              <p className="text-gray-800">These Terms are effective from June 6, 2025.</p>
              <p className="text-gray-800">Last Updated: September 8, 2025</p>
              <p className="text-gray-600 text-sm mt-4">
                If you have any questions regarding Service usage, please contact us at support@extion.co.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}