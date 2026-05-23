"use client";

import { useEffect, useState } from "react";

interface GameUIProps {
  isFinished?: boolean;
  initialTime: number;
}

export default function GameUI({ isFinished = false, initialTime }: GameUIProps) {
  const [timeLeft, setTimeLeft] = useState<string>(initialTime.toFixed(3));

  useEffect(() => {
    if (!isFinished) {
      setTimeLeft(initialTime.toFixed(3));
    }
  }, [isFinished, initialTime]);

  useEffect(() => {
    const onTimeUpdate = (e: Event) => {
      if (isFinished) return;

      const customEvent = e as CustomEvent<number>;
      setTimeLeft(customEvent.detail.toFixed(3));
    };

    window.addEventListener("update-time", onTimeUpdate);
    return () => window.removeEventListener("update-time", onTimeUpdate);
  }, [isFinished]);

  return (
    <div className="absolute top-5 right-5 bg-black/80 text-[#00ffcc] px-5 py-2.5 rounded-lg font-mono text-3xl font-bold pointer-events-none z-50 min-w-[180px] text-right border border-[#00ffcc]/30 shadow-[0_0_15px_rgba(0,255,204,0.2)]">
      <span className="text-xs mr-2 text-slate-400 uppercase tracking-widest">Time</span>
      {timeLeft}
    </div>
  );
}
