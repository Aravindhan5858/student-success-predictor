import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function MockInterviewRequests() {
  const { mockInterviewRequests, updateMockInterviewRequestStatus } = useAppContext()

  const handleStatusChange = async (requestId, nextStatus) => {
    await updateMockInterviewRequestStatus(requestId, nextStatus)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Mock Interview Requests</h2>
        <p className="text-sm text-slate-500">Manage student online mock interview contact requests.</p>
      </section>

      <Card className="p-5">
        <p className="text-sm text-slate-600">
          Total Requests: <span className="font-semibold text-slate-900">{mockInterviewRequests.length}</span>
        </p>
      </Card>

      <Table headers={['Student', 'Contact', 'Schedule', 'Mode', 'Topic', 'Status', 'Actions']}>
        {mockInterviewRequests.map((request) => (
          <tr key={request.id} className="hover:bg-slate-50">
            <td className="px-4 py-4">
              <p className="font-medium text-slate-900">{request.fullName || 'N/A'}</p>
              <p className="text-xs text-slate-500">{request.username || '-'}</p>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.contactNumber || 'N/A'}</td>
            <td className="px-4 py-4 text-slate-600">
              {request.preferredDate || '-'} {request.preferredTime || ''}
            </td>
            <td className="px-4 py-4 text-slate-600 capitalize">{request.mode || '-'}</td>
            <td className="px-4 py-4 text-slate-600">{request.topic || '-'}</td>
            <td className="px-4 py-4">
              <Badge tone={request.status === 'closed' ? 'low' : request.status === 'contacted' ? 'medium' : 'high'}>
                {request.status || 'new'}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  fullWidth={false}
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => handleStatusChange(request.id, 'contacted')}
                >
                  Mark Contacted
                </Button>
                <Link to={`/schedule-interview?studentId=${encodeURIComponent(request.studentId)}`}>
                  <Button fullWidth={false} className="px-3 py-1.5 text-xs">
                    Schedule for Student
                  </Button>
                </Link>
                <Button fullWidth={false} variant="outline" className="px-3 py-1.5 text-xs" onClick={() => handleStatusChange(request.id, 'closed')}>
                  Close
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!mockInterviewRequests.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No mock interview requests submitted yet.</Card>
      ) : null}
    </div>
  )
}

export default MockInterviewRequests
