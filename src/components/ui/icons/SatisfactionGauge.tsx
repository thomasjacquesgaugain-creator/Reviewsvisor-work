import React from 'react'

interface SatisfactionGaugeProps {
  /** Satisfaction value between 0 and 100. Invalid values (NaN, null, undefined) fall back to 0. */
  value: number | null | undefined
  /** Card title (default: "Indice de satisfaction") */
  label?: string
  /** Status badge text (default: "Moyen") */
  status?: string
  /** Status badge background color in hex (default: orange "#E89614") */
  statusColor?: string
  /** Optional description text shown below the badge */
  description?: string
  /** Fallback text shown when value is invalid (default: "—") */
  fallbackText?: string
}

/**
 * SatisfactionGauge
 *
 * Drop-in replacement for the current flat "Indice de satisfaction" KPI card.
 * Renders a semi-circular gauge with 5 colored zones, 5 emoji faces, and an
 * animated needle pointing to the current value.
 *
 * IMPORTANT — Card sizing: this component is designed to occupy the same slot
 * as the other KPI cards in the dashboard grid. It should be placed inside the
 * same flex/grid container with `flex: 1` (or equivalent) so it matches the
 * width and height of adjacent cards. The component already includes its own
 * card-style wrapper (rounded background, padding, shadow) — do NOT wrap it in
 * another card.
 *
 * Pure SVG — no external dependencies, no copyright/licensing concerns.
 *
 * @example
 * <SatisfactionGauge
 *   value={58}
 *   status="Moyen"
 *   statusColor="#E89614"
 *   description="Identification des 3 problèmes les plus critiques à résoudre en priorité."
 * />
 */
export const SatisfactionGauge: React.FC<SatisfactionGaugeProps> = ({
  value=50,
  label = 'Indice de satisfaction',
  status = 'Moyen',
  statusColor = '#E89614',
  description,
  fallbackText = '—',
}) => {
  const isValid = typeof value === 'number' && Number.isFinite(value)
  const v = isValid ? Math.max(0, Math.min(100, value as number)) : 0

  const angleDeg = 180 - (v / 100) * 180
  const angleRad = (angleDeg * Math.PI) / 180
  const cx = 160
  const cy = 170
  const needleR = 85
  const needleX = cx + needleR * Math.cos(angleRad)
  const needleY = cy - needleR * Math.sin(angleRad)

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, #F7F1F9 0%, #EFEEFA 50%, #ECEFF8 100%)',
        borderRadius: 22,
        padding: '28px 22px 24px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(139, 107, 219, 0.08)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#15151f',
          margin: '0 0 12px',
        }}
      >
        {label}
      </h3>

      <svg
        viewBox="0 0 320 220"
        style={{ width: '100%', maxWidth: 280, display: 'block', margin: '0 auto' }}
      >
        <path d="M 60 170 A 100 100 0 0 1 79.1 111.2" fill="none" stroke="#DC2626" strokeWidth={24} />
        <path d="M 79.1 111.2 A 100 100 0 0 1 129.1 74.9" fill="none" stroke="#F97316" strokeWidth={24} />
        <path d="M 129.1 74.9 A 100 100 0 0 1 190.9 74.9" fill="none" stroke="#FBBF24" strokeWidth={24} />
        <path d="M 190.9 74.9 A 100 100 0 0 1 240.9 111.2" fill="none" stroke="#84CC16" strokeWidth={24} />
        <path d="M 240.9 111.2 A 100 100 0 0 1 260 170" fill="none" stroke="#16A34A" strokeWidth={24} />

        <g transform="translate(36.4, 129.8)">
          <circle r={13} fill="#fff" stroke="#DC2626" strokeWidth={2} />
          <circle cx={-4} cy={-3} r={1.5} fill="#DC2626" />
          <circle cx={4} cy={-3} r={1.5} fill="#DC2626" />
          <path d="M -5 5 Q 0 -1 5 5" stroke="#DC2626" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(83.6, 64.8)">
          <circle r={13} fill="#fff" stroke="#F97316" strokeWidth={2} />
          <circle cx={-4} cy={-3} r={1.5} fill="#F97316" />
          <circle cx={4} cy={-3} r={1.5} fill="#F97316" />
          <path d="M -5 4 Q 0 1 5 4" stroke="#F97316" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(160, 40)">
          <circle r={13} fill="#fff" stroke="#E89614" strokeWidth={2} />
          <circle cx={-4} cy={-3} r={1.5} fill="#E89614" />
          <circle cx={4} cy={-3} r={1.5} fill="#E89614" />
          <line x1={-5} y1={3} x2={5} y2={3} stroke="#E89614" strokeWidth={2} strokeLinecap="round" />
        </g>
        <g transform="translate(236.4, 64.8)">
          <circle r={13} fill="#fff" stroke="#84CC16" strokeWidth={2} />
          <circle cx={-4} cy={-3} r={1.5} fill="#84CC16" />
          <circle cx={4} cy={-3} r={1.5} fill="#84CC16" />
          <path d="M -5 2 Q 0 6 5 2" stroke="#84CC16" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(283.6, 129.8)">
          <circle r={13} fill="#fff" stroke="#16A34A" strokeWidth={2} />
          <circle cx={-4} cy={-3} r={1.5} fill="#16A34A" />
          <circle cx={4} cy={-3} r={1.5} fill="#16A34A" />
          <path d="M -5 1 Q 0 7 5 1" stroke="#16A34A" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>

        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#15151f"
          strokeWidth={3.5}
          strokeLinecap="round"
          style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <circle cx={cx} cy={cy} r={11} fill="#15151f" />
        <circle cx={cx} cy={cy} r={4} fill="#fff" />
      </svg>

      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#15151f',
          lineHeight: 1,
          marginTop: 4,
          letterSpacing: '-0.5px',
        }}
      >
        {isValid ? `${Math.round(v)} %` : fallbackText}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '8px 22px',
          borderRadius: 999,
          background: statusColor,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          marginTop: 12,
          marginBottom: description ? 14 : 0,
        }}
      >
        {status}
      </div>

      {description && (
        <p
          style={{
            fontSize: 13,
            color: '#6b6b85',
            lineHeight: 1.55,
            margin: 0,
            paddingTop: 12,
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            width: '100%',
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default SatisfactionGauge
