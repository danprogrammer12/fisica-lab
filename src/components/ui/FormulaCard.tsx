import katex from 'katex'

interface FormulaCardProps {
  title: string
  latex: string
  description?: string
  variables?: { symbol: string; description: string; value?: string }[]
  highlight?: boolean
  color?: string
}

export function FormulaCard({
  title,
  latex,
  description,
  variables,
  highlight = false,
  color = '#3b82f6',
}: FormulaCardProps) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: true,
  })

  return (
    <div
      className="rounded-xl border p-4 space-y-3 transition-all"
      style={{
        backgroundColor: highlight ? `${color}10` : '#111827',
        borderColor: highlight ? `${color}50` : '#1e293b',
        boxShadow: highlight ? `0 0 20px ${color}15` : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>

      {/* Fórmula renderizada con KaTeX */}
      <div
        className="flex justify-center py-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {description && (
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      )}

      {variables && variables.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800">
          {variables.map((v) => {
            const symHtml = katex.renderToString(v.symbol, {
              throwOnError: false,
              displayMode: false,
            })
            return (
              <div key={v.symbol} className="flex items-start gap-2 text-xs">
                <span
                  className="shrink-0 font-mono"
                  style={{ color }}
                  dangerouslySetInnerHTML={{ __html: symHtml }}
                />
                <span className="text-slate-500">{v.description}</span>
                {v.value && (
                  <span className="ml-auto text-slate-300 font-mono shrink-0">{v.value}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
