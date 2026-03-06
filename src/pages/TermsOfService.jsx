import React from 'react';
import { Shield } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Acceptance of Terms</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            By accessing and using the Safety Training Accountability platform ("Service"), operated by 
            Neora, LLC on behalf of Aeroseal, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please contact your administrator to be removed from the notification list.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Purpose of the Service</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            This Service is provided by Neora, LLC, a digital and business services company based in Bluffton, SC, 
            exclusively for the purpose of managing and tracking mandatory workplace safety training for 
            Aeroseal employees and contractors. Use of this platform is limited to authorized users within the organization.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">3. SMS Messaging Terms</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">
            As part of this Service, you may receive automated SMS text message reminders regarding 
            your required safety training. By participating in this program:
          </p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 mb-2">
            <li>You consent to receive recurring automated text messages from Aeroseal regarding safety training</li>
            <li>Messages will be sent to the mobile number registered with your team member profile</li>
            <li>Message frequency is up to 3 messages per week during active training periods</li>
            <li><strong>Message and data rates may apply</strong></li>
            <li>Reply <strong>STOP</strong> to unsubscribe from SMS reminders at any time</li>
            <li>Reply <strong>HELP</strong> for assistance or contact your administrator</li>
          </ul>
          <p className="text-slate-600 text-sm leading-relaxed">
            Opting out of SMS reminders does not remove any obligation to complete required safety training.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Email Communications</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You may receive email reminders at the address registered with your team member profile. 
            These emails are sent as part of your employment or contractor obligations and are not 
            commercial marketing messages. To update your email address, contact your administrator.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">5. User Responsibilities</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">As a user of this Service, you agree to:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
            <li>Complete required safety training in a timely manner</li>
            <li>Provide accurate information when submitting training completion forms</li>
            <li>Keep your contact information current by notifying your administrator of any changes</li>
            <li>Not share your account credentials with others</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Accuracy of Completion Records</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            By submitting a training completion form, you acknowledge that you have watched the assigned 
            video and that your description and digital signature accurately reflect your understanding. 
            Falsifying training records may result in disciplinary action.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Changes to These Terms</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Neora, LLC reserves the right to update these Terms of Service at any time. Continued use 
            of the Service following any updates constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            For questions regarding these Terms of Service, please contact Neora, LLC at{' '}
            <a href="mailto:neorallc@gmail.com" className="text-emerald-600 hover:underline">neorallc@gmail.com</a> or your Aeroseal administrator.
          </p>
        </section>
      </div>
    </div>
  );
}