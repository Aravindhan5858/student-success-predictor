import Badge from '../components/Badge'
import AdvancedFeatureCard from '../components/AdvancedFeatureCard'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { evaluationMetrics, modelComparison } from '../data/mockData'
import { useAppContext } from '../context/AppContext'

function Evaluation() {
  const { students } = useAppContext()
  const highRiskStudents = students.filter((student) => student.riskLevel === 'High')

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {evaluationMetrics.map((metric) => (
          <Card key={metric.label} className="p-5 text-center">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{metric.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">High-Risk Students</h3>
          <div className="mt-4 space-y-4">
            {highRiskStudents.map((student) => (
              <div key={student.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <Badge tone="high">High</Badge>
                </div>
                <div className="mt-3 space-y-3">
                  <ProgressBar value={student.attendance} label="Attendance" />
                  <ProgressBar value={student.marks} label="Marks" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Model Comparison</h3>
          <div className="mt-4 space-y-4">
            {modelComparison.map((row) => (
              <div key={row.model} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{row.model}</p>
                  <Badge tone="neutral">{row.accuracy}% Acc</Badge>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <ProgressBar value={row.accuracy} label="Accuracy" />
                  <ProgressBar value={row.precision} label="Precision" />
                  <ProgressBar value={row.recall} label="Recall" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <AdvancedFeatureCard
        title="Advanced Evaluation"
        description="Model validation workflows for more reliable deployment decisions."
        points={[
          'Compare model precision and recall before selecting production model.',
          'Track high-risk cohorts and trigger focused remediation plans.',
          'Use threshold tuning experiments to reduce false alerts.',
        ]}
        tone="high"
      />
    </div>
  )
}

export default Evaluation
