import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Extion',
  description: 'Extion Privacy Policy - We protect your personal information securely.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">
            <strong>Extion</strong> (hereinafter referred to as &ldquo;Company&rdquo;) values your personal information and complies with the Personal Information Protection Act.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* 1. Purpose of Processing Personal Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Purpose of Processing Personal Information</h2>
            <p className="text-gray-700 mb-4">The Company processes personal information for the following purposes:</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 Service Provision</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provision of Extion AI Excel tool services</li>
                  <li>Natural language command processing and Excel automation features</li>
                  <li>Cloud synchronization services</li>
                  <li>Customer support and inquiry responses</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Member Management</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Member registration and identity verification</li>
                  <li>Personal identification and prevention of unauthorized use by problematic members</li>
                  <li>Restrictions on members who violate terms of service</li>
                  <li>Service usage notifications and service improvements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Marketing and Advertising</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Providing event and promotional information (only with consent)</li>
                  <li>Beta launch and promotional announcements</li>
                  <li>Service updates and new feature announcements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Personal Information Items Processed */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Personal Information Items Processed</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Required Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Upon registration</strong>: Email address, password</li>
                  <li><strong>Beta application</strong>: Name, email address, mobile phone number</li>
                  <li><strong>Service usage</strong>: Access logs, usage records, cookies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Optional Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Profile information (nickname, profile picture)</li>
                  <li>Marketing communication consent status</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>IP address, MAC address, service usage records</li>
                  <li>Access logs, cookies, device information</li>
                  <li>Browser information, OS information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Processing and Retention Period of Personal Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Processing and Retention Period of Personal Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Processing Period</h3>
                <p className="text-gray-700">Personal information is processed from the date of consent for collection and use until the purpose of collection and use is achieved.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Retention Period</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Member information</strong>: Until member withdrawal</li>
                  <li><strong>Service usage records</strong>: 1 year</li>
                  <li><strong>Beta application information</strong>: 1 year after official service launch</li>
                  <li><strong>Access logs</strong>: 3 months</li>
                  <li><strong>Customer consultation records</strong>: 3 years</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Exceptions</h3>
                <p className="text-gray-700">Information required to be preserved by relevant laws will be retained for the applicable period.</p>
              </div>
            </div>
          </section>

          {/* 4. Third-Party Provision of Personal Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Third-Party Provision of Personal Information</h2>
            <p className="text-gray-700 mb-4">The Company does not, in principle, provide your personal information to external parties.</p>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Cases of Provision</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>When you have given prior consent</li>
                <li>When required by law or when requested by investigative agencies according to procedures and methods prescribed by law for investigation purposes</li>
              </ul>
            </div>
          </section>

          {/* 5. Consignment of Personal Information Processing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Consignment of Personal Information Processing</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Consignees and Services</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Cloud services</strong>: AWS, Google Cloud (data storage and backup)</li>
                  <li><strong>Email delivery</strong>: SendGrid, Mailchimp (service notifications and marketing)</li>
                  <li><strong>Payment processing</strong>: Toss Payments, Stripe (payment and settlement)</li>
                  <li><strong>Customer support</strong>: Channel Talk, Intercom (customer consultation)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Consignment Management</h3>
                <p className="text-gray-700">We maintain personal information protection agreements with consignees to ensure secure management.</p>
              </div>
            </div>
          </section>

          {/* 6. Rights and Obligations of Data Subjects and Exercise Methods */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Rights and Obligations of Data Subjects and Exercise Methods</h2>
            <p className="text-gray-700 mb-4">You may exercise the following rights at any time:</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Rights Content</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Request notification of personal information processing status</li>
                  <li>Request access to personal information</li>
                  <li>Request correction or deletion of personal information</li>
                  <li>Request suspension of personal information processing</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Methods of Exercising Rights</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Email</strong>: jihong9412@gmail.com</li>
                  <li><strong>Customer Center</strong>: Use the inquiry function within the service</li>
                  <li><strong>Processing period</strong>: Within 10 days from the request date</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. Security Measures for Personal Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Security Measures for Personal Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Technical Protection Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Encrypted storage of personal information</li>
                  <li>Technical measures against hacking and other threats</li>
                  <li>Computer virus prevention using antivirus software</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Administrative Protection Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Restriction of personal information access privileges</li>
                  <li>Training for personal information handlers</li>
                  <li>Designation of personal information protection officer</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Physical Protection Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Access control for server rooms and data storage rooms</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. Personal Information Protection Officer */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Personal Information Protection Officer</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Personal Information Protection Officer</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Name</strong>: Jihong Lee</li>
                  <li><strong>Email</strong>: extion.official@gmail.com</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Personal Information Protection Manager</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Name</strong>: Jihong Lee</li>
                  <li><strong>Email</strong>: jihong9412@gmail.com</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. Cookie Operation and Rejection */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Cookie Operation and Rejection</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 Purpose of Cookie Use</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Service usage environment improvement</li>
                  <li>Provision of personalized services</li>
                  <li>Service usage statistics analysis</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 Cookie Rejection Method</h3>
                <p className="text-gray-700">You can reject cookies through browser settings, but some service usage may be limited.</p>
              </div>
            </div>
          </section>

          {/* 10. Changes to Privacy Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Changes to Privacy Policy</h2>
            <p className="text-gray-700">
              This Privacy Policy is effective from June 6, 2025, and any additions, deletions, or modifications due to changes in laws, policies, or security technologies will be announced on the website 7 days prior to implementation.
            </p>
          </section>

          {/* Effective Date */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-gray-800"><strong>Effective Date</strong>: June 6, 2025</p>
              <p className="text-gray-800"><strong>Last Modified</strong>: September 8, 2025</p>
              <p className="text-gray-600 text-sm mt-4">
                If you have any questions about this Privacy Policy, please contact privacy@extion.co.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}