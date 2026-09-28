import { useEffect, useState } from "react";
import { EVENT_DATE } from "@/lib/invite";

function diff() {
  const ms = EVENT_DATE.getTime() - Date.now();
  const clamped = Math.max(ms, 0);
  return {
    dias: Math.floor(clamped / 86400000),
    horas: Math.floor((clamped / 3600000) % 24),
    min: Math.floor((clamped / 60000) % 60),
    seg: Math.floor((clamped / 1000) % 60),
  };
}

export function Countdown() {
  const [time, setTime] = useState(() => diff());

  useEffect(() => {
    const id = setInterval(() => setTime(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden border border-border bg-border">
      {Object.entries(time).map(([label, value]) => (
        <div key={label} className="bg-background px-2 py-6 text-center">
          <div className="font-serif text-3xl leading-none text-foreground md:text-5xl">
            {String(value).padStart(2, "0")}
          </div>
          <div className="eyebrow mt-3 text-[0.55rem]">{label}</div>
        </div>
      ))}
    </div>
  );
}
