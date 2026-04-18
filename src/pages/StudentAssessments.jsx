import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function StudentAssessments() {
  const { currentStudent, studentAssessmentRequests, updateWorkflowRequestStatus, loadStudentWorkflowRequests } = useAppContext()

  useEffect(() => {
    if (currentStudent?.id) {
      loadStudentWorkflowRequests(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Assessment Requests</h2>
        <p className="text-sm text-slate-500">Accept/reject assessment requests, start tests, and view published marks.</p>
      </section>

      <Table headers={['Test Name', 'Status', 'Request Date', 'Score', 'Percentage', 'Result', 'Actions']}>
        {studentAssessmentRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 font-medium text-slate-900">{request.title || request.assessmentId}</td>
            <td className="px-4 py-4">
              <Badge tone={request.status === 'Published' || request.status === 'Completed' ? 'low' : request.status === 'Accepted' ? 'neutral' : request.status === 'Rejected' ? 'high' : 'medium'}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.requestDate ? new Date(request.requestDate).toLocaleString() : '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.result?.score ?? '-'}</td>
            <td className="px-4 py-4 text-slate-600">{typeof request.result?.percentage === 'number' ? `${request.result.percentage}%` : '-'}</td>
            <td className="px-4 py-4">
              <Badge tone={String(request.result?.status || '').toLowerCase() === 'pass' ? 'low' : request.result?.status ? 'high' : 'neutral'}>
                {request.result?.status || '-'}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => updateWorkflowRequestStatus(request._id, 'Accepted')}>
                  Accept
                </Button>
                <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => updateWorkflowRequestStatus(request._id, 'Rejected')}>
                  Reject
                </Button>
                {(request.status === 'Accepted' || request.status === 'Published') && request.assessmentId ? (
                  <Link to={`/student/take-assessment/${request.assessmentId}?requestId=${encodeURIComponent(request._id)}`}>
                    <Button fullWidth={false} className="px-3 py-2 text-xs">Start Test</Button>
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
