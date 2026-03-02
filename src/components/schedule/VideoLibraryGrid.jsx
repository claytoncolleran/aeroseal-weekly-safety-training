import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Save, X } from 'lucide-react';

export default function VideoLibraryGrid() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [newRow, setNewRow] = useState(null);

  const { data: library = [], isLoading } = useQuery({
    queryKey: ['videoLibrary'],
    queryFn: () => base44.entities.VideoLibrary.list('sequence_week'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      setNewRow(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VideoLibrary.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VideoLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videoLibrary'] }),
  });

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditRow({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({});
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: editRow });
  };

  const saveNew = () => {
    if (!newRow.sequence_week || !newRow.video_title || !newRow.default_video_url) return;
    createMutation.mutate({ ...newRow, active: newRow.active ?? true });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-700">Video Library</h3>
        <Button size="sm" variant="outline" onClick={() => setNewRow({ sequence_week: '', video_title: '', default_video_url: '', active: true })}>
          <Plus className="w-4 h-4 mr-1" /> Add Video
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 text-slate-500 font-medium w-20">Week #</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Video Title</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Default URL</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium w-16">Active</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {newRow && (
              <tr className="bg-emerald-50">
                <td className="px-3 py-2">
                  <Input type="number" value={newRow.sequence_week} onChange={e => setNewRow({...newRow, sequence_week: Number(e.target.value)})} className="h-7 w-16 text-xs" placeholder="1" />
                </td>
                <td className="px-3 py-2">
                  <Input value={newRow.video_title} onChange={e => setNewRow({...newRow, video_title: e.target.value})} className="h-7 text-xs" placeholder="Video title" />
                </td>
                <td className="px-3 py-2">
                  <Input value={newRow.default_video_url} onChange={e => setNewRow({...newRow, default_video_url: e.target.value})} className="h-7 text-xs" placeholder="https://..." />
                </td>
                <td className="px-3 py-2">
                  <Switch checked={newRow.active} onCheckedChange={v => setNewRow({...newRow, active: v})} />
                </td>
                <td className="px-3 py-2 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={saveNew} disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => setNewRow(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            )}
            {library.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">
                  {editingId === row.id
                    ? <Input type="number" value={editRow.sequence_week} onChange={e => setEditRow({...editRow, sequence_week: Number(e.target.value)})} className="h-7 w-16 text-xs" />
                    : row.sequence_week}
                </td>
                <td className="px-3 py-2">
                  {editingId === row.id
                    ? <Input value={editRow.video_title} onChange={e => setEditRow({...editRow, video_title: e.target.value})} className="h-7 text-xs" />
                    : <span className="text-slate-800">{row.video_title}</span>}
                </td>
                <td className="px-3 py-2">
                  {editingId === row.id
                    ? <Input value={editRow.default_video_url} onChange={e => setEditRow({...editRow, default_video_url: e.target.value})} className="h-7 text-xs" />
                    : <a href={row.default_video_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-xs">{row.default_video_url}</a>}
                </td>
                <td className="px-3 py-2">
                  {editingId === row.id
                    ? <Switch checked={editRow.active} onCheckedChange={v => setEditRow({...editRow, active: v})} />
                    : <span className={`text-xs px-2 py-0.5 rounded-full ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.active ? 'Yes' : 'No'}</span>}
                </td>
                <td className="px-3 py-2">
                  {editingId === row.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={saveEdit} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={cancelEdit}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" onClick={() => startEdit(row)}>
                        <span className="text-xs">✏️</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => deleteMutation.mutate(row.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {library.length === 0 && !newRow && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">No videos in library yet. Add one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}