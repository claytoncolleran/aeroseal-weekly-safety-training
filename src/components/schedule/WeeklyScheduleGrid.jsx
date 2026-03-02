import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function WeeklyScheduleGrid({ year }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['weeklySchedule', year],
    queryFn: () => base44.entities.WeeklySchedule.filter({ year }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WeeklySchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedule', year] });
      setEditingId(null);
    },
  });

  const sorted = [...schedules].sort((a, b) => a.week_number - b.week_number);

  const getFinalMonday = (row) => row.override_monday || row.scheduled_monday;
  const getFinalVideoUrl = (row) => row.override_video_url || row.default_video_url;

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditRow({ override_monday: row.override_monday || '', override_video_url: row.override_video_url || '', notes: row.notes || '' });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = () => {
    updateMutation.mutate({
      id: editingId,
      data: {
        override_monday: editRow.override_monday || null,
        override_video_url: editRow.override_video_url || null,
        notes: editRow.notes || null,
      }
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">No schedule generated for {year} yet.</p>
        <p className="text-sm mt-1">Use the "Generate Mondays" button above to create the schedule.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            <th className="text-left px-3 py-3 text-slate-500 font-medium w-16">Wk</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Monday</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Video Title</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Video URL</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Override Date</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Override URL</th>
            <th className="text-left px-3 py-3 text-slate-500 font-medium">Notes</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((row) => {
            const finalUrl = getFinalVideoUrl(row);
            const isMissingUrl = !finalUrl;
            const isEditing = editingId === row.id;

            return (
              <tr key={row.id} className={`hover:bg-slate-50 ${isMissingUrl ? 'bg-amber-50' : ''}`}>
                <td className="px-3 py-2 font-semibold text-slate-700">{row.week_number}</td>
                <td className="px-3 py-2 text-slate-700">
                  {getFinalMonday(row) ? format(parseISO(getFinalMonday(row)), 'MMM d, yyyy') : '—'}
                  {row.override_monday && <span className="ml-1 text-xs text-purple-600">(override)</span>}
                </td>
                <td className="px-3 py-2">
                  <span className="text-slate-800">{row.video_title || '—'}</span>
                </td>
                <td className="px-3 py-2">
                  {isMissingUrl ? (
                    <span className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertTriangle className="w-3 h-3" /> Missing
                    </span>
                  ) : (
                    <a href={finalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs max-w-[160px] truncate">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{finalUrl}</span>
                    </a>
                  )}
                  {row.override_video_url && <span className="block text-xs text-purple-600">(override)</span>}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <Input type="date" value={editRow.override_monday} onChange={e => setEditRow({...editRow, override_monday: e.target.value})} className="h-7 text-xs w-36" />
                  ) : (
                    <span className="text-slate-500 text-xs">{row.override_monday ? format(parseISO(row.override_monday), 'MMM d, yyyy') : '—'}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <Input value={editRow.override_video_url} onChange={e => setEditRow({...editRow, override_video_url: e.target.value})} className="h-7 text-xs w-48" placeholder="https://..." />
                  ) : (
                    <span className="text-slate-500 text-xs truncate max-w-[120px] block">{row.override_video_url || '—'}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <Input value={editRow.notes} onChange={e => setEditRow({...editRow, notes: e.target.value})} className="h-7 text-xs w-40" placeholder="Notes..." />
                  ) : (
                    <span className="text-slate-500 text-xs">{row.notes || '—'}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={saveEdit} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={cancelEdit}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" onClick={() => startEdit(row)}>
                      <span className="text-xs">✏️</span>
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}