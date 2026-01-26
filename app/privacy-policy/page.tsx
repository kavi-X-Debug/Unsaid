import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | Unsaid"
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80">
            Legal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy policy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last updated: [DATE]
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            UnSaid (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides an online platform where
            users can create profiles, receive anonymous questions and polls, and respond to them
            (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, and protect your
            information when you use UnSaid.
          </p>
          <p>
            By using UnSaid, you agree to the collection and use of information in accordance with
            this Privacy Policy.
          </p>

          <h2 className="text-base font-semibold mt-4">1. Information we collect</h2>

          <h3 className="text-sm font-semibold mt-2">1.1 Information you provide directly</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Account information:</span> email address, password
              (stored in hashed form if you register with email/password), display name and/or
              username.
            </li>
            <li>
              <span className="font-medium">Profile information:</span> bio, avatar and any other
              profile details you choose to add.
            </li>
            <li>
              <span className="font-medium">Content you create:</span> questions and polls you
              create, answers and poll responses you post, and any other content you submit through
              the Service.
            </li>
          </ul>

          <h3 className="text-sm font-semibold mt-2">1.2 Information from third-party providers</h3>
          <p>
            If you sign in with Google or Facebook (or other OAuth providers we support), we may
            receive basic profile information from the provider, such as your name, email address,
            profile picture and provider ID, as well as authentication tokens needed to log you in.
            We only request the minimum information needed to create and authenticate your account.
          </p>

          <h3 className="text-sm font-semibold mt-2">1.3 Automatically collected information</h3>
          <p>When you use UnSaid, certain information is automatically collected, such as:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Referring URLs</li>
            <li>Date and time of access</li>
            <li>Pages viewed and actions taken in the app</li>
          </ul>
          <p>
            This information helps us operate, secure, and improve the Service and may be used in
            aggregated or anonymized form.
          </p>

          <h2 className="text-base font-semibold mt-4">2. How we use your information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account.</li>
            <li>To authenticate you and allow you to log in.</li>
            <li>To provide the core features of the app (profiles, questions, polls, answers).</li>
            <li>To send you important service-related messages and notifications.</li>
            <li>To detect, prevent, and respond to fraud, abuse, and security incidents.</li>
            <li>To improve and optimize the Service, including troubleshooting and analytics.</li>
            <li>To comply with legal obligations and enforce our terms and policies.</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2 className="text-base font-semibold mt-4">
            3. Legal bases for processing (where applicable)
          </h2>
          <p>
            Where required by law (such as in the EU/EEA or UK), we process your personal data on
            the following legal bases:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Performance of a contract:</span> to provide and
              maintain your account and access to the Service.
            </li>
            <li>
              <span className="font-medium">Legitimate interests:</span> to secure our Service,
              prevent abuse, and improve our features.
            </li>
            <li>
              <span className="font-medium">Consent:</span> where required, for example when using
              certain cookies or marketing communications. You can withdraw consent at any time.
            </li>
          </ul>

          <h2 className="text-base font-semibold mt-4">4. Cookies and similar technologies</h2>
          <p>
            We may use cookies and similar technologies to keep you signed in, remember your
            preferences and measure usage and performance. You can control cookies through your
            browser settings, but disabling certain cookies may affect how the Service functions.
          </p>

          <h2 className="text-base font-semibold mt-4">5. How we share your information</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Service providers:</span> third-party vendors who help
              us operate the Service (such as hosting, authentication, analytics). They are only
              allowed to use your information on our instructions.
            </li>
            <li>
              <span className="font-medium">Analytics and infrastructure providers:</span> for
              example, Firebase (Authentication, Firestore and related services) and similar tools
              that help us understand and improve usage of the Service.
            </li>
            <li>
              <span className="font-medium">Legal and safety reasons:</span> we may disclose
              information if required by law or if we believe it is necessary to comply with legal
              obligations, protect the rights, property or safety of UnSaid, our users or others, or
              detect and address fraud, security or technical issues.
            </li>
          </ul>
          <p>We do not share your personal information with third parties for their own marketing.</p>

          <h2 className="text-base font-semibold mt-4">6. Data retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service, comply with
            legal obligations, resolve disputes and enforce our agreements. If you delete your
            account, we will take reasonable steps to delete or anonymize your personal information,
            unless we are required to keep it for legal reasons. Some content and aggregated or
            anonymized data may be retained in a non-identifiable form.
          </p>

          <h2 className="text-base font-semibold mt-4">7. Data deletion and your choices</h2>
          <p>You have certain choices about your information, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Updating or changing some of your account details from within the app.</li>
            <li>Deleting questions, polls or answers you have posted, where that option is offered.</li>
            <li>
              Requesting deletion of your account and associated data. Instructions for data
              deletion are available at{" "}
              <span className="font-mono">
                https://unsaid-kappa.vercel.app/data-deletion
              </span>
              .
            </li>
          </ul>
          <p>
            If you need help with data deletion or other privacy requests, you can contact us at
            [CONTACT EMAIL].
          </p>

          <h2 className="text-base font-semibold mt-4">8. International data transfers</h2>
          <p>
            Depending on where you are located, your information may be transferred to and processed
            in countries other than your own (for example, where our hosting or service providers
            are located). These countries may have data protection laws that differ from those in
            your country. We take appropriate measures to protect your information in accordance
            with this Privacy Policy and applicable law.
          </p>

          <h2 className="text-base font-semibold mt-4">9. Children&apos;s privacy</h2>
          <p>
            UnSaid is not intended for children under the age of 13 (or the minimum age required in
            your jurisdiction). We do not knowingly collect personal information from children under
            this age. If you believe that a child has provided us with personal information, please
            contact us at [CONTACT EMAIL] and we will take steps to delete the information.
          </p>

          <h2 className="text-base font-semibold mt-4">10. Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect your information from
            unauthorized access, use, alteration or destruction. However, no method of transmission
            or storage is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-base font-semibold mt-4">11. Your rights</h2>
          <p>
            Depending on your location, you may have the right to access the personal information we
            hold about you, request correction of inaccurate information, request deletion of your
            personal information, object to or restrict certain processing, or request a copy of your
            data in a portable format. To exercise any of these rights, contact us at [CONTACT EMAIL].
          </p>

          <h2 className="text-base font-semibold mt-4">12. Changes to this Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will change the
            &quot;Last updated&quot; date at the top of this page. If the changes are significant, we may
            provide additional notice (for example, in-app or by email). Your continued use of
            UnSaid after any changes means you accept the updated Privacy Policy.
          </p>

          <h2 className="text-base font-semibold mt-4">13. Contact us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices,
            you can contact us at [CONTACT EMAIL].
          </p>
          <p>Owner / operator: [OWNER NAME / ENTITY]</p>
        </section>
      </div>
    </main>
  );
}
