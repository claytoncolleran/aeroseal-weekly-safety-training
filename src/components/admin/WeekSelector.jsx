import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function WeekSelector({ schedules, selectedWeek, onSelectWeek, currentWeek }) {
  const sortedSchedules = [...schedules].sort((a, b) => a.week_number - b.week_number);

  return (
    <div className="flex items-center gap-3">
      <Calendar className="w-5 h-5 text-slate-400" />
      <Select value={String(selectedWeek)} onValueChange={(v) => onSelectWeek(Number(v))}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select week" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {sortedSchedules.map((schedule) => (
            <SelectItem key={schedule.week_number} value={String(schedule.week_number)}>
              <span className="flex items-center gap-2">
                Week {schedule.week_number}
                {schedule.week_number === currentWeek && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                <span className="text-slate-400 text-xs">
                  ({format(parseISO(schedule.scheduled_date), 'MMM d')})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}