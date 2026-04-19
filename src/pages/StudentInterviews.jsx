import { useEffect } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getInterviewStatusTone } from '../lib/interviewWorkflow'

function StudentInterviews() {
  const { currentStudent, studentInterviewRequests, loadStudentWorkflowRequests, acceptInterviewRequest } = useAppContext()

  useEffect(() => {
    if (currentStudent?.id) {
      loadStudentWorkflowRequests(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Interview Requests</h2>
        <p className="text-sm text-slate-500">Accept/reject requests, join interviews, and view published interview results.</p>
      </section>

      <Table headers={['Date', 'Type', 'Status', 'Overall', 'Feedback', 'Actions']}>
        {studentInterviewRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 text-slate-600">{request.scheduledDate ? new Date(request.scheduledDate).toLocaleString() : '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.interviewType || 'Technical'}</td>
            <td className="px-4 py-4">
              <Badge tone={getInterviewStatusTone(request.status)}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4 font-semibold text-slate-900">{request.result?.overallScore ? `${request.result.overallScore}%` : '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.result?.remarks || '-'}</td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {request.status === 'Pending' ? (
                  <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => acceptInterviewRequest(request._id)}>
                    Accept
                  </Button>
                ) : null}
                {request.status === 'Accepted' && request.meetingLink ? (
                  <a href={request.meetingLink} target="_blank" rel="noreferrer">
                    <Button fullWidth={false} className="px-3 py-2 text-xs">Join Interview</Button>
                  </a>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!studentInterviewRequests.length ? <Card className="p-6 text-center text-sm text-slate-500">No interview requests available.</Card> : null}
    </div>
  )
}

export default StudentInterviews
