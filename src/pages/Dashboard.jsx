import Card from '../components/Card'
import ChartContainer from '../components/ChartContainer'
import Badge from '../components/Badge'
import { performanceDistribution, recentActivities } from '../data/mockData'
import { useAppContext } from '../context/AppContext'

function Dashboard() {
  const { students } = useAppContext()

  const avgPredicted = students.length
    ? `${Math.round(students.reduce((sum, item) => sum + item.predictedScore, 0) / students.length)}%`
    : '0%'

  const dashboardCards = [
    { label: 'Total Students', value: `${students.length}`, change: '+0%' },
    { label: 'Average Performance Score', value: avgPredicted, change: '+0%' },
    { label: 'Model Accuracy', value: '91.2%', change: '+1.4%' },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <h2 className="text-3xl font-bold text-slate-900">{card.value}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {card.change}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <ChartContainer
          title="Student Performance Distribution"
          subtitle="Dummy analytics view based on performance score groups"
          data={performanceDistribution}
        />

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Student Activity</h3>
              <p className="text-sm text-slate-500">Live feed preview</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.student}</p>
                  <p className="text-sm text-slate-600">{item.action}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                </div>
                <Badge tone={item.risk}>{item.risk}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
