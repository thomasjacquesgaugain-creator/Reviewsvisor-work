import React from 'react'

interface SatisfactionGaugeProps {
  /** Satisfaction value 0-100. Invalid values (NaN, null, undefined) fall back to 0. */
  value: number | null | undefined
  /** Card title (default: "Indice de satisfaction") */
  label?: string
  /** Status text shown in the combined badge (default: "Moyen") */
  status?: string
  /** Badge background color in hex (default: orange "#E89614") */
  statusColor?: string
  /** Optional description shown at the bottom, justified */
  description?: string
  /** Fallback text when value is invalid (default: "—") */
  fallbackText?: string
}

/**
 * SatisfactionGauge — UPDATED LAYOUT (homogeneous KPI card style)
 *
 * IMPORTANT: this version replaces the previous SatisfactionGauge.tsx.
 *
 * The internal structure now matches the other 3 KPI cards
 * (Performance globale, Valeur ressentie, Expérience délivrée):
 *
 *   ┌─────────────────────────┐
 *   │ [Gauge SVG centered]    │   ← visual area (top, fixed height ≈ 76px)
 *   │                         │
 *   │ Indice de satisfaction  │   ← title (centered, below visual)
 *   │                         │
 *   │ (flex spacer)           │
 *   │                         │
 *   │      [58 % · Moyen]     │   ← combined badge (aligns with other cards' badges)
 *   │ Identification des 3    │   ← description (justified, sticks to bottom)
 *   │ problèmes les plus...   │
 *   └─────────────────────────┘
 *
 * The "58%" value is merged into the same pill as the status text so all four
 * KPI badges sit at the same vertical position — no extra row offsetting the
 * gauge card from its neighbors.
 *
 * Pure SVG, no external dependencies. Defensive against invalid input.
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
  value,
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

  const valueText = isValid ? `${Math.round(v)} %` : fallbackText

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, #F7F1F9 0%, #EFEEFA 50%, #ECEFF8 100%)',
        borderRadius: 16,
        padding: '16px 12px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 338,
        boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
        height: '100%',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Visual area — gauge at the top, fixed height for alignment with other cards */}
      <div
        style={{
          height: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <svg
          viewBox="0 0 320 220"
          style={{ width: '100%', maxWidth: 126, height: 84 }}
        >
          <path d="M 60 170 A 100 100 0 0 1 79.1 111.2" fill="none" stroke="#DC2626" strokeWidth={26} />
          <path d="M 79.1 111.2 A 100 100 0 0 1 129.1 74.9" fill="none" stroke="#F97316" strokeWidth={26} />
          <path d="M 129.1 74.9 A 100 100 0 0 1 190.9 74.9" fill="none" stroke="#FBBF24" strokeWidth={26} />
          <path d="M 190.9 74.9 A 100 100 0 0 1 240.9 111.2" fill="none" stroke="#84CC16" strokeWidth={26} />
          <path d="M 240.9 111.2 A 100 100 0 0 1 260 170" fill="none" stroke="#16A34A" strokeWidth={26} />

          <g transform="translate(36.4, 129.8)">
            <circle r={11} fill="#fff" stroke="#DC2626" strokeWidth={2} />
            <circle cx={-3} cy={-2.5} r={1.3} fill="#DC2626" />
            <circle cx={3} cy={-2.5} r={1.3} fill="#DC2626" />
            <path d="M -4 3.5 Q 0 -0.5 4 3.5" stroke="#DC2626" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(83.6, 64.8)">
            <circle r={11} fill="#fff" stroke="#F97316" strokeWidth={2} />
            <circle cx={-3} cy={-2.5} r={1.3} fill="#F97316" />
            <circle cx={3} cy={-2.5} r={1.3} fill="#F97316" />
            <path d="M -4 3 Q 0 1 4 3" stroke="#F97316" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(160, 40)">
            <circle r={11} fill="#fff" stroke="#E89614" strokeWidth={2} />
            <circle cx={-3} cy={-2.5} r={1.3} fill="#E89614" />
            <circle cx={3} cy={-2.5} r={1.3} fill="#E89614" />
            <line x1={-3.5} y1={2.5} x2={3.5} y2={2.5} stroke="#E89614" strokeWidth={2} strokeLinecap="round" />
          </g>
          <g transform="translate(236.4, 64.8)">
            <circle r={11} fill="#fff" stroke="#84CC16" strokeWidth={2} />
            <circle cx={-3} cy={-2.5} r={1.3} fill="#84CC16" />
            <circle cx={3} cy={-2.5} r={1.3} fill="#84CC16" />
            <path d="M -4 1.5 Q 0 4.5 4 1.5" stroke="#84CC16" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(283.6, 129.8)">
            <circle r={11} fill="#fff" stroke="#16A34A" strokeWidth={2} />
            <circle cx={-3} cy={-2.5} r={1.3} fill="#16A34A" />
            <circle cx={3} cy={-2.5} r={1.3} fill="#16A34A" />
            <path d="M -4 1 Q 0 5.5 4 1" stroke="#16A34A" strokeWidth={2} fill="none" strokeLinecap="round" />
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
          <circle cx={cx} cy={cy} r={10} fill="#15151f" />
          <circle cx={cx} cy={cy} r={3.5} fill="#fff" />
        </svg>
      </div>

      {/* Title — below the gauge, centered */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#15151f',
          lineHeight: 1.2,
          marginBottom: 10,
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label}
      </div>

      {/* Bottom section — pushed to bottom for badge alignment across cards */}
      <div
        style={{
          marginTop: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 999,
            background: statusColor,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 50,
          }}
        >
          {valueText} · {status}
        </div>

        {description && (
          <p
            style={{
              fontSize: 11,
              color: '#6b6b85',
              lineHeight: 1.45,
              textAlign: 'justify',
              textAlignLast: 'left',
              textJustify: 'inter-word',
              margin: 0,
              width: '100%',
              hyphens: 'auto',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              minHeight: '4.35em',
              maxHeight: '4.35em',
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default SatisfactionGauge
