import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export default function ReportScheduleCard() {
  const [settings, setSettings] = useState({
    is_enabled: true,
    day_of_week: 4,
    send_time: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    base44.entities.ReportScheduleSettings.list()
      .then(list => {
        if (list.length > 0) {
          setSettings({
            is_enabled: list[0].is_enabled !== false,
            day_of_week: list[0].day_of_week ?? 4,
            send_time: list[0].send_time || '08:00',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('saveReportSchedule', settings);
      toast.success('Report schedule saved successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to save schedule.');
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
            <CalendarClock className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base">Report Schedule Settings</CardTitle>
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
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Enable toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600">Weekly Report Schedule</Label>
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

            {/* Day of week */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600">Day of Week</Label>
              <Select
                value={String(settings.day_of_week)}
                onValueChange={(val) => setSettings(s => ({ ...s, day_of_week: Number(val) }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 sm:self-end"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Schedule
            </Button>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Reports are emailed to team members with "Receive Division Report" enabled.
            Disabling the toggle will prevent the scheduled report from running. Day and time changes are saved as preferences.
          </p>
        </CardContent>
      )}
    </Card>
  );
}