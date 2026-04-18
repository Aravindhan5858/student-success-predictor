import Badge from '../components/Badge'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function MyRequests() {
  const { currentStudent, mockInterviewRequests, studentInterviews, assessments } = useAppContext()

  const studentRequestItems = mockInterviewRequests.filter((request) => String(request.studentId) === String(currentStudent?.id))

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">My Requests</h2>
        <p className="text-sm text-slate-500">All your interview and assessment requests in one place.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Interview Requests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{studentRequestItems.length}</p>
          <p className="mt-1 text-xs text-slate-500">Your submitted mock interview requests</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Scheduled Interviews</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{studentInterviews.length}</p>
          <p className="mt-1 text-xs text-slate-500">Interviews assigned to your login</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Assigned Assessments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{assessments.length}</p>
          <p className="mt-1 text-xs text-slate-500">Tests available for your account</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Interview Request Status</h3>
            <p className="text-sm text-slate-500">Track the status of your submitted mock interview request(s).</p>
          </div>
        </div>

        <Table headers={['Topic', 'Mode', 'Preferred Slot', 'Status']}>
          {studentRequestItems.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50">
              <td className="px-4 py-4 font-medium text-slate-900">{request.topic || 'N/A'}</td>
              <td className="px-4 py-4 text-slate-600 capitalize">{request.mode || '-'}</td>
              <td className="px-4 py-4 text-slate-600">
                {request.preferredDate || '-'} {request.preferredTime || ''}
              </td>
              <td className="px-4 py-4">
                <Badge tone={request.status === 'closed' ? 'low' : request.status === 'contacted' ? 'medium' : 'high'}>
                  {request.status || 'new'}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>

        {!studentRequestItems.length ? (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">No interview requests submitted yet.</Card>
        ) : null}
      </Card>
    </div>
  )
}

export default MyRequests