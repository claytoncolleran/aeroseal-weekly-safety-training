import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function ReminderScheduleCard() {
  const [settings, setSettings] = useState({
    is_enabled: true,
    days_of_week: [1, 3, 5],
    send_time: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    base44.entities.ReminderScheduleSettings.list()
      .then(list => {
        if (list.length > 0) {
          setSettings({
            is_enabled: list[0].is_enabled !== false,
            days_of_week: list[0].days_of_week ?? [1, 3, 5],
            send_time: list[0].send_time || '08:00',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day) => {
    setSettings(s => {
      const already = s.days_of_week.includes(day);
      return {
        ...s,
        days_of_week: already
          ? s.days_of_week.filter(d => d !== day)
          : [...s.days_of_week, day].sort((a, b) => a - b),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('saveReminderSchedule', settings);
      toast.success('Reminder schedule saved successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to save reminder schedule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base">Reminder Schedule Settings</CardTitle>
            {!settings.is_enabled && (
              <span className="text-xs text-slate-400 font-normal">(Disabled)</span>
            )}
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Enable toggle */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600">Reminder Emails</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(val) => setSettings(s => ({ ...s, is_enabled: val }))}
                  />
                  <span className={`text-sm font-medium ${settings.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {settings.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Send time */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-600">Send Time (ET)</Label>
                <input
                  type="time"
                  value={settings.send_time}
                  onChange={(e) => setSettings(s => ({ ...s, send_time: e.target.value }))}
                  className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Days of week multi-select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600">Send on Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const selected = settings.days_of_week.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Schedule
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Reminders are sent to all active team members who have not yet completed the current week's training.
            Disabling the toggle will prevent reminder emails from being sent on any day.
          </p>
        </CardContent>
      )}
    </Card>
  );
}