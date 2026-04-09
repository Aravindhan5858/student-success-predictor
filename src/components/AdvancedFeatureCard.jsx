import Badge from './Badge'
import Card from './Card'

function AdvancedFeatureCard({ title = 'Advanced Features', description = '', points = [], tone = 'neutral' }) {
  return (
    <Card className="border border-slate-200 p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        <Badge tone={tone}>Advanced</Badge>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {points.map((point) => (
          <li key={point} className="rounded-lg bg-slate-50 px-3 py-2">
            {point}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default AdvancedFeatureCard
