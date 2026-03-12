import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Users, PlayCircle, CheckCircle2, Clock, 
  UserPlus, Calendar, TrendingUp, AlertCircle, Pencil, Filter, ArrowUpDown, Download, FileBarChart2
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import TeamMemberCard from '@/components/admin/TeamMemberCard';
import AddTeamMemberDialog from '@/components/admin/AddTeamMemberDialog';
import EditTeamMemberDialog from '@/components/admin/EditTeamMemberDialog';
import WeekSelector from '@/components/admin/WeekSelector';
import VideoScheduleTab from '@/components/schedule/VideoScheduleTab';
import DivisionReportsTab from '@/components/admin/DivisionReportsTab';
import ExportCsvButton from '@/components/admin/ExportCsvButton';
import DownloadTrainingRecordDialog from '@/components/admin/DownloadTrainingRecordDialog';
import ReportScheduleCard from '@/components/admin/ReportScheduleCard';
import ReminderScheduleCard from '@/components/admin/ReminderScheduleCard';
import GenerateReportsModal from '@/components/admin/GenerateReportsModal';

export default function AdminDashboard() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [generatingReports, setGeneratingReports] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  // Completion Status tab filters
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('alpha');
  // Completion History tab filters
  const [historyDivisionFilter, setHistoryDivisionFilter] = useState('all');
  const [historySortOrder, setHistorySortOrder] = useState('recent');
  // Team Members tab filters
  const [teamDivisionFilter, setTeamDivisionFilter] = useState('all');
  const [teamSortOrder, setTeamSortOrder] = useState('alpha');
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.TrainingSchedule.list('week_number'),
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.TrainingCompletion.list(),
  });

  // Determine current week's training
  const currentWeekNumber = useMemo(() => {
    if (schedules.length === 0) return 1;
    
    const today = startOfDay(new Date());
    const sortedSchedules = [...schedules].sort((a, b) => 
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );

    let current = sortedSchedules[0]?.week_number || 1;
    for (const schedule of sortedSchedules) {
      const scheduleDate = startOfDay(parseISO(schedule.scheduled_date));
      if (!isBefore(today, scheduleDate)) {
        current = schedule.week_number;
      } else {
        break;
      }
    }
    return current;
  }, [schedules]);

  // Set initial selected week
  useEffect(() => {
    if (selectedWeek === null && currentWeekNumber) {
      setSelectedWeek(currentWeekNumber);
    }
  }, [currentWeekNumber, selectedWeek]);

  const currentSchedule = useMemo(() => {
    return schedules.find(s => s.week_number === selectedWeek);
  }, [schedules, selectedWeek]);

  // Get completions for selected week
  const weekCompletions = useMemo(() => {
    return completions.filter(c => c.week_number === selectedWeek);
  }, [completions, selectedWeek]);

  // Active team members
  const activeMembers = useMemo(() => {
    return teamMembers.filter(m => m.is_active !== false);
  }, [teamMembers]);

  const filteredAndSortedMembers = useMemo(() => {
    let members = divisionFilter === 'all'
      ? activeMembers
      : activeMembers.filter(m => m.division === divisionFilter);

    return [...members].sort((a, b) => {
      if (sortOrder === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      // most recently completed first, then pending at bottom
      const compA = weekCompletions.find(c => c.team_member_id === a.id);
      const compB = weekCompletions.find(c => c.team_member_id === b.id);
      if (compA && compB) return new Date(compB.completion_date) - new Date(compA.completion_date);
      if (compA) return -1;
      if (compB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeMembers, divisionFilter, sortOrder, weekCompletions]);

  // Filtered/sorted completions for History tab
  const filteredAndSortedHistory = useMemo(() => {
    // Enrich completions with member division for filtering
    const enriched = weekCompletions.map(c => {
      const member = teamMembers.find(m => m.id === c.team_member_id);
      return { ...c, division: member?.division || '' };
    });
    let filtered = historyDivisionFilter === 'all'
      ? enriched
      : enriched.filter(c => c.division === historyDivisionFilter);

    return [...filtered].sort((a, b) => {
      if (historySortOrder === 'alpha') return a.team_member_name.localeCompare(b.team_member_name);
      return new Date(b.completion_date) - new Date(a.completion_date);
    });
  }, [weekCompletions, teamMembers, historyDivisionFilter, historySortOrder]);

  // Filtered/sorted members for Team Members tab
  const filteredAndSortedTeamMembers = useMemo(() => {
    let members = teamDivisionFilter === 'all'
      ? teamMembers
      : teamMembers.filter(m => m.division === teamDivisionFilter);
    return [...members].sort((a, b) => {
      if (teamSortOrder === 'alpha') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
  }, [teamMembers, teamDivisionFilter, teamSortOrder]);

  // Completion stats
  const stats = useMemo(() => {
    const completed = weekCompletions.length;
    const total = activeMembers.length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pending, percentage };
  }, [weekCompletions, activeMembers]);

  const addMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  const editMemberMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  const handleEditMember = (member) => {
    setEditingMember(member);
    setEditDialogOpen(true);
  };

  const markCompleteMutation = useMutation({
    mutationFn: async (member) => {
      await base44.entities.TrainingCompletion.create({
        team_member_id: member.id,
        team_member_name: member.name,
        week_number: selectedWeek,
        video_title: currentSchedule?.video_title || '',
        description: 'Manually marked complete by administrator',
        acknowledged: true,
        completion_date: new Date().toISOString(),
        marked_by_admin: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });

  const handleGenerateReports = async (selectedDivisions) => {
    const names = selectedDivisions.join(', ');
    toast.loading(`Generating reports for ${names}...`, { id: 'gen-reports' });
    setGeneratingReports(true);
    try {
      await base44.functions.invoke('generateDivisionReports', {
        generated_by: 'Manual',
        send_email: false,
        divisions: selectedDivisions,
      });
      toast.success(
        `Reports generated successfully. ${selectedDivisions.length} division report(s) saved to the Reports Archive.`,
        { id: 'gen-reports' }
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to generate reports. Please try again.', { id: 'gen-reports' });
    } finally {
      setGeneratingReports(false);
    }
  };

  const isLoading = schedulesLoading || membersLoading || completionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const getMemberCompletion = (memberId) => {
    return weekCompletions.find(c => c.team_member_id === memberId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage team training and track completions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDownloadDialogOpen(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Training Records
            </Button>
            <Button
              variant="outline"
              onClick={() => setGenerateModalOpen(true)}
              disabled={generatingReports}
            >
              {generatingReports ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart2 className="w-4 h-4 mr-2" />
                  Generate Reports Now
                </>
              )}
            </Button>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Week Selector & Current Training */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <WeekSelector
                schedules={schedules}
                selectedWeek={selectedWeek}
                onSelectWeek={setSelectedWeek}
                currentWeek={currentWeekNumber}
              />
              {currentSchedule && (
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-slate-700 font-medium truncate max-w-md">
                    {currentSchedule.video_title}
                  </span>
                  {selectedWeek === currentWeekNumber && (
                    <Badge className="bg-emerald-100 text-emerald-700">Current Week</Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Team Members</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-amber-500 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.percentage}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Schedule Settings (admin only) */}
        <ReportScheduleCard />

        {/* Team Status */}
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="status">Completion Status</TabsTrigger>
            <TabsTrigger value="history">Completion History</TabsTrigger>
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="schedule">Video Schedule</TabsTrigger>
            <TabsTrigger value="reports">Division Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg">Week {selectedWeek} Completion Status</CardTitle>
                  <div className="flex items-center gap-2">
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
                      currentViewData={filteredAndSortedMembers.map(m => {
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
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      Add First Team Member
                    </Button>
                  </div>
                ) : filteredAndSortedMembers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No members in this division.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedMembers.map((member) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        completion={getMemberCompletion(member.id)}
                        onMarkComplete={(m) => markCompleteMutation.mutate(m)}
                        onDelete={(m) => deleteMemberMutation.mutate(m.id)}
                        onEdit={handleEditMember}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg">Week {selectedWeek} Completions</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <Select value={historyDivisionFilter} onValueChange={setHistoryDivisionFilter}>
                      <SelectTrigger className="w-36 h-8 text-sm">
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
                    <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                    <Select value={historySortOrder} onValueChange={setHistorySortOrder}>
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recently Completed</SelectItem>
                        <SelectItem value="alpha">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                    <ExportCsvButton
                      currentViewData={filteredAndSortedHistory.map(c => ({
                        Name: c.team_member_name,
                        Division: c.division,
                        'Week Number': c.week_number,
                        'Video Title': c.video_title,
                        Description: c.description,
                        'Completion Date': c.completion_date ? format(new Date(c.completion_date), 'MMM d, yyyy h:mm a') : '',
                        'Marked by Admin': c.marked_by_admin ? 'Yes' : 'No',
                      }))}
                      allData={completions.map(c => {
                        const member = teamMembers.find(m => m.id === c.team_member_id);
                        return {
                          Name: c.team_member_name,
                          Division: member?.division || '',
                          'Week Number': c.week_number,
                          'Video Title': c.video_title,
                          Description: c.description,
                          'Completion Date': c.completion_date ? format(new Date(c.completion_date), 'MMM d, yyyy h:mm a') : '',
                          'Marked by Admin': c.marked_by_admin ? 'Yes' : 'No',
                        };
                      })}
                      filenamePrefix={`week${selectedWeek}_completions`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weekCompletions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completions recorded for this week yet.</p>
                  </div>
                ) : filteredAndSortedHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completions for this division.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedHistory.map((completion) => (
                      <div 
                        key={completion.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-800">{completion.team_member_name}</p>
                            {completion.division && (
                              <p className="text-xs text-slate-400">{completion.division}</p>
                            )}
                            <p className="text-sm text-slate-500">
                              {format(new Date(completion.completion_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          {completion.marked_by_admin && (
                            <Badge variant="outline" className="text-xs">
                              Marked by Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-2 italic">
                          "{completion.description}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg">All Team Members</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <Select value={teamDivisionFilter} onValueChange={setTeamDivisionFilter}>
                      <SelectTrigger className="w-36 h-8 text-sm">
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
                    <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                    <Select value={teamSortOrder} onValueChange={setTeamSortOrder}>
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alpha">A → Z</SelectItem>
                        <SelectItem value="alpha_desc">Z → A</SelectItem>
                      </SelectContent>
                    </Select>
                    <ExportCsvButton
                      currentViewData={filteredAndSortedTeamMembers.map(m => ({
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
                ) : filteredAndSortedTeamMembers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No members in this division.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedTeamMembers.map((member) => (
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
                            onClick={() => handleEditMember(member)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteMemberMutation.mutate(member.id)}
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
          </TabsContent>
          <TabsContent value="schedule">
            <VideoScheduleTab />
          </TabsContent>
          <TabsContent value="reports">
            <DivisionReportsTab />
          </TabsContent>
        </Tabs>
      </div>

      <AddTeamMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={(data) => addMemberMutation.mutateAsync(data)}
      />
      <DownloadTrainingRecordDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        completions={completions}
        teamMembers={teamMembers}
      />
      <EditTeamMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={editingMember}
        onSave={(id, data) => editMemberMutation.mutateAsync({ id, data })}
      />
      <GenerateReportsModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={handleGenerateReports}
      />
    </div>
  );
}