import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SignaturePad({ onSignatureChange }) {
  const sigRef = useRef(null);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onSignatureChange(sigRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-600 text-sm font-medium">
          Signature <span className="text-red-500">*</span>
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-xs text-slate-400 h-6 px-2">
          Clear
        </Button>
      </div>
      <div className="border-2 border-slate-200 rounded-lg bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1e293b"
          canvasProps={{ className: 'w-full', height: 140 }}
          onEnd={handleEnd}
        />
      </div>
      <p className="text-xs text-slate-400">Sign above using your finger or mouse</p>
    </div>
  );
}