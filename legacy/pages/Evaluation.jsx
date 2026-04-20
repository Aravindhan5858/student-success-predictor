import Badge from '../components/Badge'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { useAppContext } from '../context/AppContext'

function Evaluation() {
  const { students } = useAppContext()
  const highRiskStudents = students.filter((student) => student.riskLevel === 'High')
  const mediumRiskStudents = students.filter((student) => student.riskLevel === 'Medium')
  const lowRiskStudents = students.filter((student) => student.riskLevel === 'Low')

  const totalStudents = students.length || 1
  const averagePredicted = Math.round(students.reduce((sum, student) => sum + Number(student.predictedScore || 0), 0) / totalStudents)
  const averageAttendance = Math.round(students.reduce((sum, student) => sum + Number(student.attendance || 0), 0) / totalStudents)
  const averageMarks = Math.round(students.reduce((sum, student) => sum + Number(student.marks || 0), 0) / totalStudents)

  const evaluationMetrics = [
    { label: 'Total Students', value: students.length },
    { label: 'Average Predicted', value: `${averagePredicted}%` },
    { label: 'Average Attendance', value: `${averageAttendance}%` },
    { label: 'Average Marks', value: `${averageMarks}%` },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Evaluation</h2>
        <p className="text-sm text-slate-500">Compare model outcomes and review high-risk student segments.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {evaluationMetrics.map((metric) => (
          <Card key={metric.label} className="p-5 text-center">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{metric.value}</p>
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
          <h3 className="text-lg font-semibold text-slate-900">Risk Distribution</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">Low Risk Students</p>
                <Badge tone="low">{lowRiskStudents.length}</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={Math.round((lowRiskStudents.length / totalStudents) * 100)} label="Low Risk %" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">Medium Risk Students</p>
                <Badge tone="medium">{mediumRiskStudents.length}</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={Math.round((mediumRiskStudents.length / totalStudents) * 100)} label="Medium Risk %" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">High Risk Students</p>
                <Badge tone="high">{highRiskStudents.length}</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={Math.round((highRiskStudents.length / totalStudents) * 100)} label="High Risk %" />
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Evaluation
