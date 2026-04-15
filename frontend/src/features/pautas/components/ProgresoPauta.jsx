export default function ProgresoPauta({ inspeccionados, total, size = 'md' }) {
  const pct = total > 0 ? Math.round((inspeccionados / total) * 100) : 0
  const radio = size === 'sm' ? 22 : 32
  const stroke = size === 'sm' ? 4 : 5
  const circum = 2 * Math.PI * radio
  const offset = circum - (pct / 100) * circum

  return (
    <div className="flex items-center gap-2">
      <svg
        width={radio * 2 + stroke * 2}
        height={radio * 2 + stroke * 2}
        viewBox={`0 0 ${radio * 2 + stroke * 2} ${radio * 2 + stroke * 2}`}
        className="-rotate-90"
      >
        <circle
          cx={radio + stroke}
          cy={radio + stroke}
          r={radio}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={radio + stroke}
          cy={radio + stroke}
          r={radio}
          fill="none"
          stroke={pct === 100 ? '#10b981' : '#3b82f6'}
          strokeWidth={stroke}
          strokeDasharray={circum}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={`font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'} ${pct === 100 ? 'text-emerald-600' : 'text-gray-700'}`}>
          {pct}%
        </span>
        <span className={`text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
          {inspeccionados}/{total}
        </span>
      </div>
    </div>
  )
}
