import { useEffect, useMemo, useState } from "react";
import { MoonStar, Sun } from "lucide-react";

function getTimeParts(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    const values = {};

    parts.forEach((part) => {
      if (part.type !== "literal") {
        values[part.type] = Number(part.value);
      }
    });

    return {
      hour: values.hour % 24,
      minute: values.minute,
      second: values.second,
    };
  } catch {
    return {
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
  }
}

function formatDigitalTime(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 19);
  }
}

function formatDate(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export default function DetailedAnalogClock({
  timeZone = "UTC",
  label = "Local Time",
  size = 320,
  className = "",
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const { hour, minute, second } = useMemo(
    () => getTimeParts(now, timeZone),
    [now, timeZone],
  );

  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6 + second * 0.1;
  const secondAngle = second * 6;

  const isDaytime = hour >= 6 && hour < 18;

  const palette = isDaytime
    ? {
        face: "#f8fafc",
        innerFace: "#ffffff",
        text: "#0f172a",
        minorTick: "#cbd5e1",
        majorTick: "#475569",
        hourHand: "#0f172a",
        minuteHand: "#334155",
        secondHand: "#f97316",
        center: "#4f46e5",
      }
    : {
        face: "#020617",
        innerFace: "#0f172a",
        text: "#f8fafc",
        minorTick: "#334155",
        majorTick: "#94a3b8",
        hourHand: "#f8fafc",
        minuteHand: "#cbd5e1",
        secondHand: "#facc15",
        center: "#818cf8",
      };

  return (
    <div
      className={[
        "overflow-hidden rounded-[2rem] border p-5 shadow-2xl transition-colors duration-700 sm:p-6",
        isDaytime
          ? "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-amber-50 shadow-sky-100"
          : "border-indigo-400/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-indigo-950/50",
        className,
      ].join(" ")}
      aria-label={`${label}の現在時刻`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p
            className={[
              "text-xs font-black uppercase tracking-[0.22em]",
              isDaytime ? "text-indigo-600" : "text-indigo-300",
            ].join(" ")}
          >
            Local Time
          </p>

          <h3
            className={[
              "mt-1 text-xl font-black",
              isDaytime ? "text-slate-900" : "text-white",
            ].join(" ")}
          >
            {label}
          </h3>
        </div>

        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            isDaytime
              ? "bg-amber-100 text-amber-600"
              : "bg-indigo-400/15 text-indigo-200",
          ].join(" ")}
        >
          {isDaytime ? (
            <Sun className="h-7 w-7" />
          ) : (
            <MoonStar className="h-7 w-7" />
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <svg
          viewBox="0 0 300 300"
          role="img"
          aria-label={`${formatDigitalTime(now, timeZone)}を示すアナログ時計`}
          style={{
            width: size,
            maxWidth: "100%",
            height: "auto",
          }}
        >
          <defs>
            <filter
              id="clockShadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="10"
                floodOpacity="0.2"
              />
            </filter>

            <radialGradient id="clockGlow" cx="50%" cy="42%" r="65%">
              <stop
                offset="0%"
                stopColor={isDaytime ? "#ffffff" : "#1e293b"}
              />
              <stop offset="100%" stopColor={palette.innerFace} />
            </radialGradient>
          </defs>

          <circle
            cx="150"
            cy="150"
            r="137"
            fill={palette.face}
            filter="url(#clockShadow)"
          />

          <circle
            cx="150"
            cy="150"
            r="128"
            fill="url(#clockGlow)"
            stroke={isDaytime ? "#dbeafe" : "#3730a3"}
            strokeWidth="3"
          />

          {Array.from({ length: 60 }, (_, index) => {
            const angle = (index * 6 * Math.PI) / 180;
            const isMajor = index % 5 === 0;
            const innerRadius = isMajor ? 108 : 116;
            const outerRadius = 123;

            const x1 = 150 + Math.sin(angle) * innerRadius;
            const y1 = 150 - Math.cos(angle) * innerRadius;
            const x2 = 150 + Math.sin(angle) * outerRadius;
            const y2 = 150 - Math.cos(angle) * outerRadius;

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? palette.majorTick : palette.minorTick}
                strokeWidth={isMajor ? 4 : 1.5}
                strokeLinecap="round"
              />
            );
          })}

          {Array.from({ length: 12 }, (_, index) => {
            const number = index + 1;
            const angle = (number * 30 * Math.PI) / 180;
            const radius = 91;

            const x = 150 + Math.sin(angle) * radius;
            const y = 150 - Math.cos(angle) * radius + 6;

            return (
              <text
                key={number}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="17"
                fontWeight="800"
                fill={palette.text}
              >
                {number}
              </text>
            );
          })}

          <line
            x1="150"
            y1="156"
            x2="150"
            y2="88"
            stroke={palette.hourHand}
            strokeWidth="10"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 150 150)`}
          />

          <line
            x1="150"
            y1="160"
            x2="150"
            y2="59"
            stroke={palette.minuteHand}
            strokeWidth="7"
            strokeLinecap="round"
            transform={`rotate(${minuteAngle} 150 150)`}
          />

          <line
            x1="150"
            y1="172"
            x2="150"
            y2="48"
            stroke={palette.secondHand}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${secondAngle} 150 150)`}
          />

          <circle
            cx="150"
            cy="150"
            r="11"
            fill={palette.center}
            stroke={palette.innerFace}
            strokeWidth="4"
          />

          <circle cx="150" cy="150" r="3.5" fill={palette.secondHand} />
        </svg>
      </div>

      <div
        className={[
          "mt-3 rounded-2xl px-4 py-3 text-center",
          isDaytime ? "bg-white/80" : "bg-white/5",
        ].join(" ")}
      >
        <p
          className={[
            "font-mono text-3xl font-black tracking-wider",
            isDaytime ? "text-slate-900" : "text-white",
          ].join(" ")}
        >
          {formatDigitalTime(now, timeZone)}
        </p>

        <p
          className={[
            "mt-1 text-sm font-bold",
            isDaytime ? "text-slate-500" : "text-slate-300",
          ].join(" ")}
        >
          {formatDate(now, timeZone)}
        </p>

        <p
          className={[
            "mt-1 text-xs",
            isDaytime ? "text-slate-400" : "text-slate-400",
          ].join(" ")}
        >
          {timeZone}
        </p>
      </div>
    </div>
  );
}