"use client";

interface Props {
  streak: number;
}

export function DailyStreakCard({ streak }: Props) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="bg-ink text-white rounded-[14px] p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
      <div
        className="absolute -right-12 -top-12 w-[220px] h-[220px] pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(124,58,237,.6), rgba(124,58,237,0))",
        }}
      />
      <div className="relative">
        <div className="text-white/65 text-[12px] uppercase tracking-wider">Daily streak</div>
        <div className="text-[56px] font-bold tracking-tight leading-none mt-2.5 tabular-nums">
          {streak}
        </div>
        <div className="text-white/70 mt-1 text-[13px]">
          {streak === 0
            ? "Show up tomorrow and the day after. Watch this number grow."
            : `${streak} day${streak === 1 ? "" : "s"} in a row. Don't break it now.`}
        </div>
      </div>

      <div className="relative flex gap-2 mt-4">
        {days.map((d, i) => {
          const lit = i <= today && streak > today - i;
          return (
            <div
              key={i}
              className={`flex-1 py-2 rounded-lg text-center text-[11px] ${
                lit ? "bg-accent text-white font-semibold" : "bg-white/[0.06] text-white/70"
              }`}
            >
              <span className="block text-sm font-semibold text-white mb-0.5">
                {lit ? "✓" : "·"}
              </span>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
