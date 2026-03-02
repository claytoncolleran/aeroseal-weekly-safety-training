import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarDays, ChevronRight, ChevronDown } from 'lucide-react';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import VideoLibraryGrid from './VideoLibraryGrid';

// Returns the date of the first Monday on or after Jan 1 of the given year
function getFirstMondayOfYear(year) {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay(); // 0=Sun, 1=Mon...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + daysUntilMonday);
  return firstMonday;
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function VideoScheduleTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [generating, setGenerating] = useState(false);
  const [generatingNext, setGeneratingNext] = useState(false);
  const queryClient = useQueryClient();

  const { data: library = [] } = useQuery({
    queryKey: ['videoLibrary'],
    queryFn: () => base44.entities.VideoLibrary.list('sequence_week'),
  });

  const { data: allSchedules = [] } = useQuery({
    queryKey: ['weeklyScheduleAll'],
    queryFn: () => base44.entities.WeeklySchedule.list(),
  });

  const generateYear = async (year) => {
    const existingForYear = allSchedules.filter(s => s.year === year);
    const existingWeeks = new Set(existingForYear.map(s => s.week_number));

    const firstMonday = getFirstMondayOfYear(year);
    const toCreate = [];

    for (let week = 1; week <= 52; week++) {
      if (existingWeeks.has(week)) continue;

      const monday = new Date(firstMonday);
      monday.setDate(firstMonday.getDate() + (week - 1) * 7);

      // Only include weeks whose Monday falls within the selected year
      if (monday.getFullYear() > year) break;

      const libEntry = library.find(v => v.sequence_week === week);

      toCreate.push({
        year,
        week_number: week,
        scheduled_monday: toDateString(monday),
        video_library_id: libEntry?.id || null,
        video_title: libEntry?.video_title || null,
        default_video_url: libEntry?.default_video_url || null,
      });
    }

    if (toCreate.length > 0) {
      await base44.entities.WeeklySchedule.bulkCreate(toCreate);
    }
    queryClient.invalidateQueries({ queryKey: ['weeklySchedule', year] });
    queryClient.invalidateQueries({ queryKey: ['weeklyScheduleAll'] });
    return toCreate.length;
  };

  const handleGenerateCurrent = async () => {
    setGenerating(true);
    await generateYear(selectedYear);
    setGenerating(false);
  };

  const handleGenerateNext = async () => {
    setGeneratingNext(true);
    await generateYear(selectedYear + 1);
    setGeneratingNext(false);
  };

  const yearOptions = [];
  for (let y = currentYear - 1; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  const scheduledCount = allSchedules.filter(s => s.year === selectedYear).length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Year:</span>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateCurrent}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarDays className="w-4 h-4 mr-2" />}
              Generate Mondays for {selectedYear}
            </Button>

            <Button
              onClick={handleGenerateNext}
              disabled={generatingNext}
              variant="outline"
            >
              {generatingNext ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Prepopulate {selectedYear + 1}
            </Button>

            {scheduledCount > 0 && (
              <span className="text-sm text-slate-500 ml-2">{scheduledCount} weeks scheduled for {selectedYear}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{selectedYear} Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <WeeklyScheduleGrid year={selectedYear} />
        </CardContent>
      </Card>

      {/* Video Library */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Video Library</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoLibraryGrid />
        </CardContent>
      </Card>
    </div>
  );
}