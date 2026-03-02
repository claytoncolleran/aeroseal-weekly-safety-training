import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function CompletionForm({ 
  videoTitle, 
  weekNumber, 
  userName, 
  onSubmit, 
  isSubmitting,
  alreadyCompleted 
}) {
  const [description, setDescription] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (description.length < 50) {
      setError('Please provide a description of at least 50 characters.');
      return;
    }
    
    if (!acknowledged) {
      setError('Please acknowledge that you watched and understood the training.');
      return;
    }

    onSubmit({ description, acknowledged });
  };

  if (alreadyCompleted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <p className="font-semibold text-lg">Training Completed!</p>
              <p className="text-emerald-600 text-sm">You've already completed this week's training.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Complete Your Training
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-600 text-sm font-medium">Video Title</Label>
            <Input 
              value={videoTitle} 
              disabled 
              className="bg-slate-50 text-slate-700 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 text-sm font-medium">
              Describe what you learned from this training *
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please summarize the key points and safety practices covered in the video..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-slate-400">
              {description.length}/50 characters minimum
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
              className="mt-0.5"
            />
            <Label 
              htmlFor="acknowledge" 
              className="text-sm text-slate-700 cursor-pointer leading-relaxed"
            >
              I confirm that I have watched the entire safety training video and understand the material presented.
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 text-sm font-medium">Your Name</Label>
              <Input 
                value={userName || 'Not logged in'} 
                disabled 
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 text-sm font-medium">Date</Label>
              <Input 
                value={format(new Date(), 'MMMM d, yyyy')} 
                disabled 
                className="bg-slate-50"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Completion'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}