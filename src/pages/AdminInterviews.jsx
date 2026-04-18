import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function AdminInterviews() {
  const { workflowRequests, loadWorkflowRequests, updateWorkflowRequestStatus } = useAppContext()

  useEffect(() => {
    loadWorkflowRequests('interview')
  }, [])

  const interviewRequests = workflowRequests.filter((item) => item.type === 'interview')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Interview Requests</h2>
          <p className="text-sm text-slate-500">Send, track and update interview workflow requests.</p>
        </div>
        <Link to="/admin/schedule-interview">
          <Button fullWidth={false}>Send Request</Button>
        </Link>
      </div>

      <Table headers={['Student Name', 'Type', 'Date', 'Status', 'Actions']}>
        {interviewRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 font-medium text-slate-900">{request.studentName}</td>
            <td className="px-4 py-4 text-slate-600">{request.interviewType || 'Technical'}</td>
            <td className="px-4 py-4 text-slate-600">{request.scheduledDate ? new Date(request.scheduledDate).toLocaleString() : '-'}</td>
            <td className="px-4 py-4">
              <Badge tone={request.status === 'Published' || request.status === 'Completed' ? 'low' : request.status === 'Accepted' ? 'neutral' : request.status === 'Rejected' ? 'high' : 'medium'}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => updateWorkflowRequestStatus(request._id, 'Pending')}>
                  Pending
                </Button>
                <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => updateWorkflowRequestStatus(request._id, 'Accepted')}>
                  Accept
                </Button>
                <Button fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={() => updateWorkflowRequestStatus(request._id, 'Rejected')}>
                  Reject
                </Button>
                <Link to={`/admin/interview-result/${request._id}`}>
                  <Button fullWidth={false} className="px-3 py-2 text-xs">Add Result</Button>
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!interviewRequests.length ? <Card className="p-6 text-center text-sm text-slate-500">No interview requests yet.</Card> : null}
    </div>
  )
}

export default AdminInterviews
