import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { useAppContext } from '../context/AppContext'

function StudentDashboard() {
  const { currentStudent, assessments, studentInterviews, latestAssessmentResult, latestInterviewResult, getStudentFullPerformance } = useAppContext()
  const [overallIndex, setOverallIndex] = useState(null)

  useEffect(() => {
    const loadPerformance = async () => {
      if (!currentStudent?.id) {
        setOverallIndex(null)
        return
      }

      const result = await getStudentFullPerformance(String(currentStudent.id))
      if (result.ok) {
        const computedIndex = Number(result.data?.overallScore)
        setOverallIndex(Number.isFinite(computedIndex) ? computedIndex : null)
      }
    }

    loadPerformance()
  }, [currentStudent?.id])

  const latestAssessmentPercentage = Number(latestAssessmentResult?.percentage || 0)
  const latestInterviewPercentage = Number(latestInterviewResult?.feedback?.overallScore || 0)

  if (!currentStudent) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Student profile not found</h2>
        <p className="mt-2 text-sm text-slate-500">Your account has no mapped student record.</p>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Student Dashboard</h2>
        <p className="text-sm text-slate-500">Track your current performance and academic progress indicators.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Performance Summary</h3>
            <p className="mt-1 text-sm text-slate-500">Welcome, {currentStudent.name}. Here is your current performance summary.</p>
          </div>
          <Badge tone={currentStudent.riskLevel.toLowerCase()}>{currentStudent.riskLevel} Risk</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Predicted Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{currentStudent.predictedScore}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Latest Assessment</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{latestAssessmentPercentage}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Latest Interview</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{latestInterviewPercentage}%</p>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Assigned Interviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{studentInterviews.length}</p>
            <p className="mt-1 text-xs text-slate-500">Interviews specifically scheduled for you</p>
            <div className="mt-4">
              <Link to="/student/interviews">
                <Button fullWidth={false} variant="outline" className="px-4 py-2 text-xs">
                  View Interviews
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Assigned Assessments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{assessments.length}</p>
            <p className="mt-1 text-xs text-slate-500">Tests available for your login only</p>
            <div className="mt-4">
              <Link to="/student/assessments">
                <Button fullWidth={false} variant="outline" className="px-4 py-2 text-xs">
                  View Assessments
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Request Center</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">Open</p>
            <p className="mt-1 text-xs text-slate-500">View all your requests in one place</p>
            <div className="mt-4">
              <Link to="/my-requests">
                <Button fullWidth={false} variant="outline" className="px-4 py-2 text-xs">
                  Open Requests
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Overall Performance Index</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{overallIndex ?? currentStudent.predictedScore}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Attendance</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{currentStudent.attendance}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Marks</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{currentStudent.marks}%</p>
          </Card>
        </div>

        <div className="mt-8 space-y-5">
          <ProgressBar value={currentStudent.attendance} label="Attendance Progress" />
          <ProgressBar value={currentStudent.marks} label="Assignment / Marks Progress" />
          <ProgressBar value={currentStudent.interactionScore} label="Classroom Interaction Progress" />
          <ProgressBar value={currentStudent.predictedScore} label="Predicted Performance" />
          <ProgressBar value={overallIndex ?? currentStudent.predictedScore} label="Overall Performance Index" />
        </div>

        <div className="mt-8">
          <Link to={`/student/${currentStudent.id}`}>
            <Button fullWidth={false}>View My Details</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default StudentDashboard
