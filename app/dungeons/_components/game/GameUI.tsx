"use client";

import { useEffect, useState } from "react";

interface GameUIProps {
  isFinished?: boolean;
  initialTime: number;
}

export default function GameUI({ isFinished = false, initialTime }: GameUIProps) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);

  useEffect(() => {
    if (!isFinished) {
      setTimeLeft(initialTime);
    }
  }, [isFinished, initialTime]);

  useEffect(() => {
    const onTimeUpdate = (e: Event) => {
      if (isFinished) return;

      const customEvent = e as CustomEvent<number>;
      setTimeLeft(customEvent.detail);
    };

    window.addEventListener("update-time", onTimeUpdate);
    return () => window.removeEventListener("update-time", onTimeUpdate);
  }, [isFinished]);

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "24px",
        pointerEvents: "none",
        zIndex: 50, // Phaserより手前に表示
      }}
    >
      TIME: {timeLeft}s
    </div>
  );
}
