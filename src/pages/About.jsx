import React from 'react';
import { Shield, MapPin, Mail, Briefcase } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">About Neora, LLC</h1>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          Neora, LLC is a digital and business services company based in Bluffton, South Carolina. 
          We partner with businesses to design, build, and operate custom digital tools and platforms 
          that improve operational efficiency, accountability, and communication.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <Briefcase className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">What We Do</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                We provide digital solutions including custom web applications, business automation, 
                and technology services tailored to the needs of small and mid-sized companies.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Location</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Bluffton, South Carolina
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">About This Platform</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            The Safety Training Accountability platform is built and operated by Neora, LLC on behalf 
            of Aeroseal. It enables Aeroseal to manage weekly safety training requirements, track 
            completion records, and deliver automated email and SMS reminders to team members across 
            their organization.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6 mt-2">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Contact</h2>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Mail className="w-4 h-4 text-emerald-600" />
            <a href="mailto:neorallc@gmail.com" className="text-emerald-600 hover:underline">
              neorallc@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}