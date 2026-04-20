import Card from '../components/Card'
import ChartContainer from '../components/ChartContainer'
import Badge from '../components/Badge'
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

  const totalStudents = students.length || 1
  const gradeBuckets = {
    A: students.filter((student) => student.predictedScore >= 90).length,
    B: students.filter((student) => student.predictedScore >= 80 && student.predictedScore < 90).length,
    C: students.filter((student) => student.predictedScore >= 70 && student.predictedScore < 80).length,
    D: students.filter((student) => student.predictedScore >= 60 && student.predictedScore < 70).length,
    F: students.filter((student) => student.predictedScore < 60).length,
  }

  const performanceDistribution = Object.entries(gradeBuckets).map(([label, value]) => ({
    label,
    value: Math.round((value / totalStudents) * 100),
  }))

  const recentActivities = students
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 4)
    .map((student, index) => ({
      id: student.id,
      student: student.name,
      action:
        student.riskLevel === 'High'
          ? 'High-risk profile requires intervention'
          : student.riskLevel === 'Medium'
            ? 'Moderate-risk profile needs periodic monitoring'
            : 'Low-risk profile is stable',
      time: index === 0 ? 'Recently updated' : `${index * 10 + 5} min ago`,
      risk: student.riskLevel.toLowerCase(),
    }))

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm text-slate-500">Quick snapshot of student performance and recent activity.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map((card) => (
          <Card key={card.label} className="metric-card p-5">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">{card.value}</h3>
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
          subtitle="Live distribution from current student prediction data"
          data={performanceDistribution}
        />

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Student Activity</h3>
              <p className="text-sm text-slate-500">Based on current student risk status</p>
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
