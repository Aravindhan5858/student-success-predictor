import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function AdminInterviewRequests() {
  const { interviewRequests, updateMockInterviewRequestStatus } = useAppContext()

  const handleMarkReviewed = async (requestId) => {
    await updateMockInterviewRequestStatus(requestId, 'reviewed')
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Interview Requests</h2>
        <p className="text-sm text-slate-500">Review student mock interview requests and proceed to scheduling.</p>
      </section>

      <Table headers={['Student', 'Contact', 'Preferred Slot', 'Type', 'Status', 'Actions']}>
        {interviewRequests.map((request) => (
          <tr key={request._id || request.id} className="hover:bg-slate-50">
            <td className="px-4 py-4">
              <p className="font-medium text-slate-900">{request.studentName}</p>
              <p className="text-xs text-slate-500">{request.studentEmail}</p>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.contactNumber || '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.preferredDate || '-'} {request.preferredTime || ''}</td>
            <td className="px-4 py-4 text-slate-600">{request.interviewType || 'Technical'}</td>
            <td className="px-4 py-4">
              <Badge tone={request.status === 'scheduled' ? 'low' : request.status === 'reviewed' ? 'medium' : 'high'}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  fullWidth={false}
                  variant="outline"
                  className="px-3 py-2 text-xs"
                  onClick={() => handleMarkReviewed(request._id || request.id)}
                >
                  Mark Reviewed
                </Button>
                <Link to="/schedule-interview">
                  <Button fullWidth={false} className="px-3 py-2 text-xs">Schedule</Button>
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!interviewRequests.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No interview requests found.</Card>
      ) : null}
    </div>
  )
}

export default AdminInterviewRequests
