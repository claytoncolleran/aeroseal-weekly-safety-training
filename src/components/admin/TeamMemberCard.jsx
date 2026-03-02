import React from 'react';
import { CheckCircle2, XCircle, Clock, MoreVertical, Trash2, CheckSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamMemberCard({ 
  member, 
  completion, 
  onMarkComplete, 
  onDelete,
  showActions = true 
}) {
  const isComplete = !!completion;

  return (
    <div className={`
      flex items-center justify-between p-4 rounded-xl border transition-all
      ${isComplete 
        ? 'bg-emerald-50/50 border-emerald-200' 
        : 'bg-white border-slate-200 hover:border-slate-300'
      }
    `}>
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isComplete ? 'bg-emerald-100' : 'bg-slate-100'}
        `}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Clock className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-slate-800">{member.name}</p>
          <p className="text-sm text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`
          text-xs font-medium px-3 py-1.5 rounded-full
          ${isComplete 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-amber-100 text-amber-700'
          }
        `}>
          {isComplete ? 'Completed' : 'Pending'}
        </span>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isComplete && (
                <DropdownMenuItem onClick={() => onMarkComplete(member)}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Mark as Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(member)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}