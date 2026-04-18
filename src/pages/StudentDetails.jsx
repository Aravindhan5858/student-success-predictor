import { useParams, Link, Navigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { useAppContext } from '../context/AppContext'

function StudentDetails() {
  const { id } = useParams()
  const { students, currentUser } = useAppContext()
  const student = students.find((item) => String(item.id) === String(id))

  if (!student) {
    return <Navigate to={currentUser?.role === 'student' ? '/student-dashboard' : '/students'} replace />
  }

  if (currentUser?.role === 'student' && currentUser.username !== student.username) {
    return <Navigate to="/student-dashboard" replace />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Profile</h2>
          <p className="text-sm text-slate-500">Detailed metrics and performance summary</p>
        </div>
        {currentUser?.role === 'admin' ? (
          <Link to="/students">
            <Button fullWidth={false} variant="outline">
              Back to Students
            </Button>
          </Link>
        ) : null}
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">Student ID #{student.id}</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{student.name}</h3>
            <p className="mt-2 text-sm text-slate-500">Academic profile with predicted success insights.</p>
          </div>
          <Badge tone={student.riskLevel.toLowerCase()}>{student.riskLevel} Risk</Badge>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Predicted Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{student.predictedScore}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Attendance</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{student.attendance}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Interaction</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{student.interactionScore}%</p>
          </Card>
        </div>

        <div className="mt-8 space-y-5">
          <ProgressBar value={student.attendance} label="Attendance Progress" />
          <ProgressBar value={student.marks} label="Marks Progress" />
          <ProgressBar value={student.interactionScore} label="Classroom Interaction Progress" />
          <ProgressBar value={student.predictedScore} label="Predicted Performance" />
        </div>
      </Card>
    </div>
  )
}

export default StudentDetails
