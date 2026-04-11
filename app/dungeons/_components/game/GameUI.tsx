import { useEffect, useState } from "react";

export default function GameUI() {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const onTimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setTimeLeft(customEvent.detail);
    };

    window.addEventListener("update-time", onTimeUpdate);
    return () => window.removeEventListener("update-time", onTimeUpdate);
  }, []);

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
      }}
    >
      TIME: {timeLeft}s
    </div>
  );
}
