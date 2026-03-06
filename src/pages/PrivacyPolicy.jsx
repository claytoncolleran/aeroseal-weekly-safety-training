import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Overview</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Neora, LLC ("Company," "we," "us," or "our") is a digital and business services provider based in 
            Bluffton, SC, operating the Safety Training Accountability platform on behalf of Aeroseal. 
            This Privacy Policy describes how we collect, use, and protect information in connection with our 
            email and SMS text message reminder services used to notify team members about safety training requirements.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Information We Collect</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">We collect the following information from team members:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
            <li>Full name and email address</li>
            <li>Mobile phone number (for SMS reminders)</li>
            <li>Organizational division</li>
            <li>Training completion records, including signatures and acknowledgments</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">3. How We Use Your Information</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">Your information is used exclusively for:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
            <li>Sending email reminders about required weekly safety training</li>
            <li>Sending SMS text message reminders about required weekly safety training</li>
            <li>Tracking and recording training completion for compliance purposes</li>
            <li>Generating training reports for administrative use</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">4. SMS Communications</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">
            By providing your mobile phone number, you consent to receive SMS text message reminders 
            regarding mandatory safety training. Message frequency varies based on your training completion 
            status — typically up to 3 messages per week during active training periods (Monday, Wednesday, and Friday).
          </p>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">
            <strong>Message and data rates may apply.</strong> Contact your wireless provider for details about your plan.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            To opt out of SMS reminders, contact your administrator or reply <strong>STOP</strong> to any message. 
            For help, reply <strong>HELP</strong> or contact your administrator directly.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Data Sharing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. Your data may be 
            accessed by authorized administrators within your organization for training compliance purposes. 
            We use trusted third-party service providers (including email and SMS delivery services) solely 
            to deliver training notifications on our behalf. These providers are prohibited from using 
            your information for any other purpose.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Data Retention</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Training completion records are retained for as long as required to meet regulatory and 
            company compliance obligations. Contact your administrator to request updates or removal 
            of your personal information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Contact Us</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If you have questions about this Privacy Policy or how your information is used, 
            please contact Neora, LLC at <a href="mailto:neorallc@gmail.com" className="text-emerald-600 hover:underline">neorallc@gmail.com</a> or your Aeroseal administrator.
          </p>
        </section>
      </div>
    </div>
  );
}