interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
  color?: string
  formatValue?: (v: number) => string
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
  color = '#3b82f6',
  formatValue,
}: SliderControlProps) {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(step < 1 ? 2 : 0)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span
          className="text-sm font-mono font-semibold px-2 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}20` }}
        >
          {displayValue}
          {unit && <span className="text-xs ml-1 opacity-70">{unit}</span>}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Track de fondo */}
        <div className="absolute w-full h-1.5 rounded-full bg-slate-700" />

        {/* Track de progreso */}
        <div
          className="absolute h-1.5 rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color, opacity: 0.7 }}
        />

        {/* Input range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Thumb visual */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 shadow-lg pointer-events-none transition-all"
          style={{
            left: `calc(${percentage}% - 8px)`,
            borderColor: color,
            backgroundColor: '#0f172a',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}
