import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import TeamMemberCard from '@/components/admin/TeamMemberCard';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export default function CompletionStatusTab({
  selectedWeek,
  activeMembers,
  weekCompletions,
  onMarkComplete,
  onDelete,
  onEdit,
  onAddFirst,
}) {
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('alpha');
  const [searchTerm, setSearchTerm] = useState('');

  const getMemberCompletion = (memberId) =>
    weekCompletions.find(c => c.team_member_id === memberId);

  const filteredAndSorted = useMemo(() => {
    let members = divisionFilter === 'all'
      ? activeMembers
      : activeMembers.filter(m => m.division === divisionFilter);

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      members = members.filter(m => m.name?.toLowerCase().includes(term));
    }

    return [...members].sort((a, b) => {
      if (sortOrder === 'alpha') return a.name.localeCompare(b.name);
      const compA = getMemberCompletion(a.id);
      const compB = getMemberCompletion(b.id);
      if (compA && compB) return new Date(compB.completion_date) - new Date(compA.completion_date);
      if (compA) return -1;
      if (compB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeMembers, divisionFilter, sortOrder, searchTerm, weekCompletions]);

  return (
    <Card className="border border-slate-200 border-t-0 rounded-xl rounded-t-none shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Week {selectedWeek} Completion Status</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm w-48"
              />
            </div>
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="Midwest">Midwest</SelectItem>
                <SelectItem value="Southwest">Southwest</SelectItem>
                <SelectItem value="Mountain">Mountain</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
              </SelectContent>
            </Select>
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="recent">Most Recently Completed</SelectItem>
              </SelectContent>
            </Select>
            <ExportCsvButton
              currentViewData={filteredAndSorted.map(m => {
                const comp = getMemberCompletion(m.id);
                return {
                  Name: m.name,
                  Email: m.email,
                  Division: m.division || '',
                  Status: comp ? 'Completed' : 'Pending',
                  'Completion Date': comp?.completion_date ? format(new Date(comp.completion_date), 'MMM d, yyyy h:mm a') : '',
                  'Marked by Admin': comp?.marked_by_admin ? 'Yes' : 'No',
                };
              })}
              allData={activeMembers.map(m => {
                const comp = getMemberCompletion(m.id);
                return {
                  Name: m.name,
                  Email: m.email,
                  Division: m.division || '',
                  Status: comp ? 'Completed' : 'Pending',
                  'Completion Date': comp?.completion_date ? format(new Date(comp.completion_date), 'MMM d, yyyy h:mm a') : '',
                  'Marked by Admin': comp?.marked_by_admin ? 'Yes' : 'No',
                };
              })}
              filenamePrefix={`week${selectedWeek}_status`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No team members added yet.</p>
            <Button variant="outline" className="mt-4" onClick={onAddFirst}>
              Add First Team Member
            </Button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No members match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSorted.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                completion={getMemberCompletion(member.id)}
                onMarkComplete={onMarkComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}