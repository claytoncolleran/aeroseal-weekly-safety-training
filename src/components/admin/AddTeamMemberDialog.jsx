import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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

export default function AddTeamMemberDialog({ open, onOpenChange, onAdd }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Attempt to invite to Base44 (sends password setup email) — may fail if current user is not a platform admin
      try {
        await base44.users.inviteUser(email.trim(), 'user');
      } catch (_inviteErr) {
        // Invitation failed (e.g. insufficient permissions) — continue to create TeamMember record anyway
      }
      // Create TeamMember record
      await onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, division: division || undefined, is_active: true });
      setName('');
      setEmail('');
      setPhone('');
      setDivision('');
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Failed to add team member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger id="division">
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="Midwest">Midwest</SelectItem>
                <SelectItem value="Southwest">Southwest</SelectItem>
                <SelectItem value="Mountain">Mountain</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
              </SelectContent>
            </Select>
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
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}