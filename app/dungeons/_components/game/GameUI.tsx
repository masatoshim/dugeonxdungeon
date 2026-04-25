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
      // 数字を小数点3桁の文字列に固定
      setTimeLeft(customEvent.detail.toFixed(3));
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
        background: "rgba(0,0,0,0.8)",
        color: "#00ffcc",
        padding: "10px 20px",
        borderRadius: "8px",
        fontFamily: "'Courier New', monospace",
        fontSize: "28px",
        fontWeight: "bold",
        pointerEvents: "none",
        zIndex: 50,
        minWidth: "180px",
        textAlign: "right",
        border: "1px solid rgba(0,255,204,0.3)",
        boxShadow: "0 0 15px rgba(0,255,204,0.2)",
      }}
    >
      <span style={{ fontSize: "14px", marginRight: "8px", color: "#aaa" }}>TIME</span>
      {timeLeft}
    </div>
  );
}
