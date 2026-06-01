import React from "react";

interface PerformanceIconProps {
  label?: string;
  color?: string;
  description?: string;
}

export const PerformanceIcon: React.FC<PerformanceIconProps> = ({
  label = "Average",
  color = "orange",
  description,
}) => {
  const percentage =
    color === "green"
      ? 85
      : color === "orange"
      ? 65
      : color === "red"
      ? 30
      : 50;

  const angleDeg = 180 - (percentage / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 160;
  const cy = 170;
  const needleR = 82;

  const needleX = cx + needleR * Math.cos(angleRad);
  const needleY = cy - needleR * Math.sin(angleRad);

  const gaugeColor =
    color === "green"
      ? "#16A34A"
      : color === "orange"
      ? "#E89614"
      : color === "red"
      ? "#DC2626"
      : "#6B7280";

  return (
    <div className="h-full flex flex-col items-center justify-between">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Global Performance
          </h3>

          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Performance based on overall analytics
          </p>
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${gaugeColor}20`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <rect x="7" y="14" width="2.5" height="6" rx="0.4" />
            <rect x="11.5" y="9" width="2.5" height="11" rx="0.4" />
            <rect x="16" y="12" width="2.5" height="8" rx="0.4" />
            <path d="M5 10 Q 10 5 14 7 T 21 4" />
          </svg>
        </div>
      </div>

      {/* Gauge */}
      <div className="relative w-full flex justify-center pt-2">
        <svg
          viewBox="0 0 320 220"
          className="w-full max-w-[260px]"
        >
          {/* Base Arc */}
          <path
            d="M 60 170 A 100 100 0 0 1 260 170"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={14}
            strokeLinecap="round"
          />

          {/* Active Arc */}
          <path
            d="M 60 170 A 100 100 0 0 1 260 170"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray="314"
            strokeDashoffset={314 - (314 * percentage) / 100}
            style={{
              transition: "all 0.6s ease",
            }}
          />

          {/* Labels */}
          <text
            x="52"
            y="186"
            fontSize="10"
            fill="#6B7280"
          >
            Low
          </text>

          <text
            x="146"
            y="52"
            fontSize="10"
            fill="#6B7280"
          >
            Avg
          </text>

          <text
            x="240"
            y="186"
            fontSize="10"
            fill="#6B7280"
          >
            High
          </text>

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#111827"
            strokeWidth={4}
            strokeLinecap="round"
            style={{
              transition:
                "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Center */}
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="#111827"
          />

          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center">
        <div
          className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow-sm"
          style={{
            backgroundColor: gaugeColor,
          }}
        >
          {label}
        </div>
      </div>

      {/* Footer */}
      {description && (
        <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed text-center">
            {description}
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceIcon;