import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, Calendar, AlertTriangle } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import VideoPlayer from '@/components/training/VideoPlayer';
import CompletionForm from '@/components/training/CompletionForm';

export default function Training() {
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.TrainingSchedule.list('week_number'),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.TrainingCompletion.list(),
  });

  // Find team member by user email
  useEffect(() => {
    if (user && teamMembers.length > 0) {
      const member = teamMembers.find(m => m.email.toLowerCase() === user.email.toLowerCase());
      setTeamMember(member);
    }
  }, [user, teamMembers]);

  // Determine current week's training
  const currentTraining = useMemo(() => {
    if (schedules.length === 0) return null;
    
    const today = startOfDay(new Date());
    const sortedSchedules = [...schedules].sort((a, b) => 
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );

    // Find the most recent training that has started
    let currentWeekTraining = null;
    for (const schedule of sortedSchedules) {
      const scheduleDate = startOfDay(parseISO(schedule.scheduled_date));
      if (!isBefore(today, scheduleDate)) {
        currentWeekTraining = schedule;
      } else {
        break;
      }
    }

    return currentWeekTraining || sortedSchedules[0];
  }, [schedules]);

  // Check if current user has completed current training
  const userCompletion = useMemo(() => {
    if (!teamMember || !currentTraining) return null;
    return completions.find(
      c => c.team_member_id === teamMember.id && c.week_number === currentTraining.week_number
    );
  }, [completions, teamMember, currentTraining]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TrainingCompletion.create({
        team_member_id: teamMember.id,
        team_member_name: teamMember.name,
        week_number: currentTraining.week_number,
        video_title: currentTraining.video_title,
        description: data.description,
        acknowledged: data.acknowledged,
        completion_date: new Date().toISOString(),
        marked_by_admin: false,
        signature_url: data.signature_url || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });

  if (schedulesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!currentTraining) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">No Training Available</h2>
          <p className="text-slate-500 mt-2">Training schedule is not configured yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <PlayCircle className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Weekly Safety Training</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Week {currentTraining.week_number} Training
          </h1>
          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {format(parseISO(currentTraining.scheduled_date), 'MMMM d, yyyy')}
              </span>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Active
            </Badge>
          </div>
        </div>

        {/* Video Section */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-slate-900 text-white">
            <CardTitle className="text-lg font-medium">
              {currentTraining.video_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VideoPlayer 
              videoLink={currentTraining.video_link} 
              title={currentTraining.video_title}
            />
          </CardContent>
        </Card>

        {/* Completion Form or Status */}
        {!teamMember ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Account Not Linked</p>
                  <p className="text-sm text-amber-600">
                    Your account ({user?.email || 'Not logged in'}) is not linked to a team member. 
                    Please contact your administrator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <CompletionForm
            videoTitle={currentTraining.video_title}
            weekNumber={currentTraining.week_number}
            userName={teamMember.name}
            onSubmit={(data) => submitMutation.mutate(data)}
            isSubmitting={submitMutation.isPending}
            alreadyCompleted={!!userCompletion}
          />
        )}

        {/* Direct video link */}
        <div className="mt-6 text-center">
          <a 
            href={currentTraining.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
          >
            Having trouble? Open video in YouTube →
          </a>
        </div>

        {/* Legal Links */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-x-4">
          <a href="/About" className="hover:text-emerald-600 transition-colors">About</a>
          <span>·</span>
          <a href="/PrivacyPolicy" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/TermsOfService" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}