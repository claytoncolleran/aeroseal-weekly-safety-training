import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export default function EditTeamMemberDialog({ open, onOpenChange, member, onSave }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('');
  const [receiveDivisionReport, setReceiveDivisionReport] = useState(false);
  const [onLeave, setOnLeave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setPhone(member.phone || '');
      setDivision(member.division || '');
      setReceiveDivisionReport(member.receive_division_report || false);
      setOnLeave(member.on_leave || false);
      setError('');
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(member.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        division: division || undefined,
        receive_division_report: receiveDivisionReport,
        on_leave: onLeave,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Failed to update team member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address *</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-division">Division</Label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger id="edit-division">
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="Midwest">Midwest</SelectItem>
                <SelectItem value="Southwest">Southwest</SelectItem>
                <SelectItem value="Mountain">Mountain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {division && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-division-report"
                checked={receiveDivisionReport}
                onCheckedChange={(checked) => setReceiveDivisionReport(!!checked)}
              />
              <Label htmlFor="edit-division-report" className="text-sm font-normal cursor-pointer">
                Send this person the weekly Thursday division report
              </Label>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <Checkbox
              id="edit-on-leave"
              checked={onLeave}
              onCheckedChange={(checked) => setOnLeave(!!checked)}
            />
            <Label htmlFor="edit-on-leave" className="text-sm font-normal cursor-pointer">
              Currently on leave <span className="text-slate-400">(excluded from reports and reminders)</span>
            </Label>
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}