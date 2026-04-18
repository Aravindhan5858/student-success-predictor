import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ChartContainer from '../components/ChartContainer'
import ProgressBar from '../components/ProgressBar'
import { useAppContext } from '../context/AppContext'

function StudentDetails() {
  const { id } = useParams()
  const { students, interviews, assessmentResults, currentUser, currentStudent, getStudentFullPerformance } = useAppContext()
  const [activeTab, setActiveTab] = useState('assessment')
  const [fullPerformance, setFullPerformance] = useState(null)
  const student = students.find((item) => String(item.id) === String(id))

  useEffect(() => {
    const loadPerformance = async () => {
      if (!student?.id) {
        setFullPerformance(null)
        return
      }

      const result = await getStudentFullPerformance(String(student.id))
      if (result.ok) {
        setFullPerformance(result.data)
      }
    }

    loadPerformance()
  }, [student?.id])

  if (!student) {
    return <Navigate to={currentUser?.role === 'student' ? '/student-dashboard' : '/students'} replace />
  }

  if (currentUser?.role === 'student' && currentUser.username !== student.username) {
    return <Navigate to="/student-dashboard" replace />
  }

  const fallbackAssessmentRows = assessmentResults
    .filter((item) => String(item.studentId) === String(student.id))
    .map((item) => ({
      key: item._id,
      label: item.assessmentId,
      score: Number(item.percentage || 0),
      status: item.status,
      date: item.createdAt,
    }))

  const assessmentRows = (fullPerformance?.student?.assessments || []).map((item, index) => ({
    key: `${item.testName}-${index}`,
    label: item.testName,
    score: Number(item.percentage || 0),
    status: item.status,
    date: item.createdAt,
  }))

  const fallbackInterviewRows = interviews
    .filter((item) => String(item.studentId) === String(student.id))
    .map((item) => ({
      key: item._id,
      label: item.interviewType,
      score: Number(item?.feedback?.overallScore || 0),
      status: item.status,
      date: item.interviewDateTime,
      remarks: item?.feedback?.remarks || '',
    }))

  const interviewRows = (fullPerformance?.student?.interviews || []).map((item, index) => ({
    key: `${item.type}-${item.date}-${index}`,
    label: item.type,
    score: Number(item.score || 0),
    status: item.status,
    date: item.date,
    remarks: item.feedback?.remarks || '',
  }))

  const resolvedAssessments = assessmentRows.length ? assessmentRows : fallbackAssessmentRows
  const resolvedInterviews = interviewRows.length ? interviewRows : fallbackInterviewRows

  const latestAssessmentScore = resolvedAssessments[0]?.score || 0
  const latestInterviewScore = resolvedInterviews[0]?.score || 0
  const overallPerformanceIndex = Number(fullPerformance?.overallScore || student.predictedScore || 0)

  const trendData = useMemo(() => {
    const assessmentAverage =
      resolvedAssessments.length > 0
        ? Math.round(resolvedAssessments.reduce((total, row) => total + Number(row.score || 0), 0) / resolvedAssessments.length)
        : 0

    const interviewAverage =
      resolvedInterviews.length > 0
        ? Math.round(resolvedInterviews.reduce((total, row) => total + Number(row.score || 0), 0) / resolvedInterviews.length)
        : 0

    return [
      { label: 'Attendance', value: Number(student.attendance || 0) },
      { label: 'Marks', value: Number(student.marks || 0) },
      { label: 'Assessments', value: assessmentAverage },
      { label: 'Interviews', value: interviewAverage },
      { label: 'Overall', value: overallPerformanceIndex },
    ]
  }, [resolvedAssessments, resolvedInterviews, student.attendance, student.marks, overallPerformanceIndex])

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
            <p className="text-sm text-slate-500">Latest Assessment</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{latestAssessmentScore}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Latest Interview</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{latestInterviewScore}%</p>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Overall Performance Index</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{overallPerformanceIndex}%</p>
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
          <ProgressBar value={overallPerformanceIndex} label="Overall Performance Index" />
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'assessment', label: 'Assessments' },
              { key: 'interview', label: 'Interviews' },
              { key: 'trend', label: 'Trend' },
            ].map((tab) => (
              <Button
                key={tab.key}
                type="button"
                fullWidth={false}
                variant={activeTab === tab.key ? 'primary' : 'outline'}
                className="px-4 py-2 text-xs sm:text-sm"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'assessment' ? (
            <div className="mt-4 space-y-3">
              {!resolvedAssessments.length ? (
                <Card className="p-4 text-sm text-slate-500">No assessment records available.</Card>
              ) : (
                resolvedAssessments.map((item) => (
                  <Card key={item.key} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleString() : '-'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={item.status === 'Passed' ? 'low' : 'high'}>{item.status || 'Pending'}</Badge>
                        <p className="text-sm font-semibold text-slate-900">{item.score}%</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'interview' ? (
            <div className="mt-4 space-y-3">
              {!resolvedInterviews.length ? (
                <Card className="p-4 text-sm text-slate-500">No interview records available.</Card>
              ) : (
                resolvedInterviews.map((item) => (
                  <Card key={item.key} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleString() : '-'}</p>
                        {item.remarks ? <p className="mt-1 text-xs text-slate-500">Remarks: {item.remarks}</p> : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={item.status === 'Completed' ? 'low' : 'medium'}>{item.status || 'Scheduled'}</Badge>
                        <p className="text-sm font-semibold text-slate-900">{item.score}%</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'trend' ? (
            <div className="mt-4">
              <ChartContainer
                title="Performance Trend"
                subtitle="Combined view of attendance, marks, assessments, interviews and overall index"
                data={trendData}
              />
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

export default StudentDetails
