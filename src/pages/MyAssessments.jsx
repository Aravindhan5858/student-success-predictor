import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAppContext } from '../context/AppContext'

function MyAssessments() {
  const { assessments } = useAppContext()

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">My Assessments</h2>
        <p className="text-sm text-slate-500">View tests assigned to your account and take them online.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {assessments.map((assessment) => (
          <Card key={assessment._id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{assessment.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{assessment.description || 'Assessment assigned to your profile.'}</p>
              </div>
              <Badge tone={assessment.status === 'active' ? 'low' : 'neutral'}>{assessment.status || 'active'}</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-50 px-3 py-1">Marks: {assessment.totalMarks}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">Questions: {assessment.questions?.length || 0}</span>
            </div>

            <div className="mt-5">
              <Link to={`/take-assessment/${assessment._id}`}>
                <Button fullWidth={false} className="px-5">
                  Take Test
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {!assessments.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No assessments assigned yet.</Card>
      ) : null}
    </div>
  )
}

export default MyAssessments