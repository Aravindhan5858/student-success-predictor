import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getAssessmentStatusTone } from '../lib/assessmentWorkflow'

function StudentAssessments() {
  const { currentStudent, studentAssessmentRequests, acceptAssessmentRequest, loadStudentAssessments } = useAppContext()

  useEffect(() => {
    if (currentStudent?.id) {
      loadStudentAssessments(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  const handleAccept = async (requestId) => {
    await acceptAssessmentRequest(requestId)
    if (currentStudent?.id) {
      await loadStudentAssessments(String(currentStudent.id))
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Assessment Requests</h2>
        <p className="text-sm text-slate-500">Accept requests, start assessments, and track submissions and published results.</p>
      </section>

      <Table headers={['Sender', 'Receiver', 'Test Name', 'Status', 'Request Date', 'Score', 'Percentage', 'Result', 'Actions']}>
        {studentAssessmentRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 text-slate-600 capitalize">{request.senderRole || 'admin'}</td>
            <td className="px-4 py-4 text-slate-600 capitalize">{request.receiverRole || 'student'}</td>
            <td className="px-4 py-4 font-medium text-slate-900">{request.assessmentTitle || request.title || request.assessment?.title || request.assessmentId}</td>
            <td className="px-4 py-4">
              <Badge tone={getAssessmentStatusTone(request.status)}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.requestDate ? new Date(request.requestDate).toLocaleString() : '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.score ?? request.result?.score ?? '-'}</td>
            <td className="px-4 py-4 text-slate-600">{typeof (request.percentage ?? request.result?.percentage) === 'number' ? `${request.percentage ?? request.result?.percentage}%` : '-'}</td>
            <td className="px-4 py-4">
              <Badge tone={String(request.resultStatus || request.result?.status || '').toLowerCase() === 'pass' ? 'low' : request.resultStatus || request.result?.status ? 'high' : 'neutral'}>
                {request.resultStatus || request.result?.status || '-'}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {request.status === 'Requested' ? (
                  <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => handleAccept(request._id)}>
                    Accept
                  </Button>
                ) : null}
                {(request.status === 'Accepted' || request.status === 'In Progress' || request.status === 'Submitted' || request.status === 'Evaluated' || request.status === 'Published') && request.assessmentId ? (
                  <Link to={`/student/take-assessment/${request.assessmentId}?requestId=${encodeURIComponent(request._id)}`}>
                    <Button fullWidth={false} className="px-3 py-2 text-xs">
                      {request.status === 'Submitted' || request.status === 'Evaluated' || request.status === 'Published' ? 'Review Test' : request.status === 'In Progress' ? 'Continue Test' : 'Start Test'}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!studentAssessmentRequests.length ? <Card className="p-6 text-center text-sm text-slate-500">No assessment requests available.</Card> : null}
    </div>
  )
}

export default StudentAssessments
