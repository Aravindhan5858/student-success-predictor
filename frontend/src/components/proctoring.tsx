"use client";

import { useEffect, useRef, useState } from "react";
import { proctoringAPI } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ProctoringProps {
  sessionId: string;
  enabled: boolean;
  onViolation?: (count: number) => void;
}

export function Proctoring({ sessionId, enabled, onViolation }: ProctoringProps) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = () => document.documentElement.requestFullscreen?.();
    enterFullscreen();

    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("copy_paste", "Attempted to copy/paste");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) logViolation("tab_switch", "Switched tab or window");
    };

    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        logViolation("webcam_disabled", "Webcam not accessible");
      }
    };

    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    setupWebcam();

    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.exitFullscreen?.();
    };
  }, [enabled, sessionId]);

  const logViolation = async (type: string, details: string) => {
    try {
      const response = await proctoringAPI.logViolation(sessionId, type, details);
      const count = response.data.count;
      setViolations(count);
      setWarning(`Warning: ${details}. Violations: ${count}/3`);
      onViolation?.(count);
      setTimeout(() => setWarning(null), 5000);
    } catch (error) {
      console.error("Failed to log violation:", error);
    }
  };

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {warning && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      <video ref={videoRef} autoPlay muted className="w-32 h-24 rounded-lg border-2 border-red-500" />
      <div className="text-xs text-center mt-1 text-red-600">Proctoring Active</div>
    </div>
  );
}
