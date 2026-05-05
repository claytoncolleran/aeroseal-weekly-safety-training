import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown, Pencil, Users, Search } from 'lucide-react';
import ExportCsvButton from '@/components/admin/ExportCsvButton';

export default function TeamMembersTab({ teamMembers, onEdit, onDelete, onAdd }) {
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('alpha');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSorted = useMemo(() => {
    let members = divisionFilter === 'all'
      ? teamMembers
      : teamMembers.filter(m => m.division === divisionFilter);

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      members = members.filter(m =>
        m.name?.toLowerCase().includes(term)
      );
    }

    return [...members].sort((a, b) => {
      if (sortOrder === 'alpha') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
  }, [teamMembers, divisionFilter, sortOrder, searchTerm]);

  return (
    <Card className="border border-slate-200 border-t-0 rounded-xl rounded-t-none shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">All Team Members</CardTitle>
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
                <SelectItem value="alpha">A → Z</SelectItem>
                <SelectItem value="alpha_desc">Z → A</SelectItem>
              </SelectContent>
            </Select>
            <ExportCsvButton
              currentViewData={filteredAndSorted.map(m => ({
                Name: m.name,
                Email: m.email,
                Phone: m.phone || '',
                Division: m.division || '',
                Active: m.is_active !== false ? 'Yes' : 'No',
              }))}
              allData={teamMembers.map(m => ({
                Name: m.name,
                Email: m.email,
                Phone: m.phone || '',
                Division: m.division || '',
                Active: m.is_active !== false ? 'Yes' : 'No',
              }))}
              filenamePrefix="team_members"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No team members added yet.</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No members match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSorted.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200"
              >
                <div>
                  <p className="font-medium text-slate-800">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                  {member.phone && (
                    <p className="text-sm text-slate-400">{member.phone}</p>
                  )}
                  {member.division && (
                    <p className="text-xs text-slate-400">{member.division}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => onEdit(member)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}