import React from 'react'

/**
 * PerformanceIcon
 *
 * Custom icon for the "Performance globale" KPI card.
 * Combines bar chart with a soft curve overlay — visually richer than a
 * standard 3-bar icon but without an explicit upward arrow (which would
 * falsely suggest "improving" regardless of the actual value).
 *
 * Stays monochrome to remain consistent with the other KPI icons
 * (HeartHandshake, ClipboardCheck) and the gauge.
 *
 * @example
 * <PerformanceIcon width={24} height={24} />
 */
export const PerformanceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3v18h18" />
    <rect x="7" y="14" width="2.5" height="6" rx="0.4" />
    <rect x="11.5" y="9" width="2.5" height="11" rx="0.4" />
    <rect x="16" y="12" width="2.5" height="8" rx="0.4" />
    <path d="M5 10 Q 10 5 14 7 T 21 4" />
  </svg>
)

export default PerformanceIcon
