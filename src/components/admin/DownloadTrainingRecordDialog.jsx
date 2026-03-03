import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

function exportToCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

export default function DownloadTrainingRecordDialog({ open, onOpenChange, completions, teamMembers }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [division, setDivision] = useState('all');

  const handleDownload = () => {
    let filtered = completions;

    if (startDate) {
      filtered = filtered.filter(c =>
        c.completion_date && new Date(c.completion_date) >= startOfDay(parseISO(startDate))
      );
    }
    if (endDate) {
      filtered = filtered.filter(c =>
        c.completion_date && new Date(c.completion_date) <= endOfDay(parseISO(endDate))
      );
    }

    if (division !== 'all') {
      filtered = filtered.filter(c => {
        const member = teamMembers.find(m => m.id === c.team_member_id);
        return member?.division === division;
      });
    }

    const rows = filtered.map(c => {
      const member = teamMembers.find(m => m.id === c.team_member_id);
      return {
        Name: c.team_member_name,
        Division: member?.division || '',
        'Week Number': c.week_number,
        'Video Title': c.video_title,
        Description: c.description || '',
        'Completion Date': c.completion_date ? format(new Date(c.completion_date), 'MMM d, yyyy h:mm a') : '',
        'Marked by Admin': c.marked_by_admin ? 'Yes' : 'No',
        'Signature': c.signature_url || '',
      };
    });

    const divisionLabel = division === 'all' ? 'all_divisions' : division.toLowerCase();
    const dateLabel = startDate && endDate ? `${startDate}_to_${endDate}` : startDate || endDate || 'all_dates';
    exportToCsv(`training_records_${divisionLabel}_${dateLabel}`, rows);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Training Records</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Division</Label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="Midwest">Midwest</SelectItem>
                <SelectItem value="Southwest">Southwest</SelectItem>
                <SelectItem value="Mountain">Mountain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}