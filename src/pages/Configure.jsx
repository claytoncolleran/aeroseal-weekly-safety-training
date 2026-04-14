import React from 'react';
import ReportScheduleCard from '@/components/admin/ReportScheduleCard';
import ReminderScheduleCard from '@/components/admin/ReminderScheduleCard';
import VideoScheduleTab from '@/components/schedule/VideoScheduleTab';

export default function Configure() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Configure</h1>
          <p className="text-slate-500 mt-1">Manage schedules, reminders, and video assignments</p>
        </div>

        <ReportScheduleCard />
        <ReminderScheduleCard />

        <div className="mt-6">
          <VideoScheduleTab />
        </div>
      </div>
    </div>
  );
}