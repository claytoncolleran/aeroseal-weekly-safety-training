import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DIVISIONS = ['East', 'Midwest', 'Southwest', 'Mountain'];

export default function GenerateReportsModal({ open, onOpenChange, onGenerate }) {
  const [selected, setSelected] = useState(new Set(DIVISIONS));

  const allSelected = selected.size === DIVISIONS.length;

  const toggleDivision = (div) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(div)) next.delete(div);
      else next.add(div);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(DIVISIONS));
  };

  const handleGenerate = () => {
    onOpenChange(false);
    onGenerate([...selected]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Division Reports</DialogTitle>
          <DialogDescription>
            Select the divisions you want to generate reports for.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <button
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-3"
            onClick={toggleAll}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          <div className="space-y-3">
            {DIVISIONS.map(div => (
              <div
                key={div}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                onClick={() => toggleDivision(div)}
              >
                <Checkbox
                  id={`div-${div}`}
                  checked={selected.has(div)}
                  onCheckedChange={() => toggleDivision(div)}
                  onClick={e => e.stopPropagation()}
                />
                <Label htmlFor={`div-${div}`} className="cursor-pointer font-medium text-slate-700">
                  {div}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={selected.size === 0}
            onClick={handleGenerate}
          >
            Generate Reports
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}