import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getAssessmentStatusTone } from '../lib/assessmentWorkflow'

function AdminAssessmentRequests() {
  const { workflowRequests, loadWorkflowRequests } = useAppContext()

  useEffect(() => {
    loadWorkflowRequests('assessment')
    const intervalId = setInterval(() => loadWorkflowRequests('assessment'), 8000)
    return () => clearInterval(intervalId)
  }, [])

  const assessmentRequests = workflowRequests.filter((request) => request.type === 'assessment')

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Assessment Requests</h2>
        <p className="text-sm text-slate-500">Live tracking for Requested, Accepted, Submitted, Evaluated and Published states.</p>
      </section>

      <Table headers={['Student', 'Test', 'Status', 'Score', 'Percentage', 'Actions']}>
        {assessmentRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 font-medium text-slate-900">{request.studentName}</td>
            <td className="px-4 py-4 text-slate-600">{request.assessmentTitle || request.title || request.assessmentId}</td>
            <td className="px-4 py-4">
              <Badge tone={getAssessmentStatusTone(request.status)}>{request.status}</Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.score ?? '-'}</td>
            <td className="px-4 py-4 text-slate-600">{typeof request.percentage === 'number' ? `${request.percentage}%` : '-'}</td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {request.status === 'Submitted' ? (
                  <Link to={`/admin/evaluate/${request._id}`}>
                    <Button fullWidth={false} className="px-3 py-2 text-xs">Evaluate</Button>
                  </Link>
                ) : null}
                {request.status === 'Evaluated' ? (
                  <Link to={`/admin/publish-result/${request._id}`}>
                    <Button fullWidth={false} className="px-3 py-2 text-xs">Publish</Button>
                  </Link>
                ) : null}
                {request.status === 'Published' ? (
                  <Badge tone="low">Published</Badge>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!assessmentRequests.length ? <Card className="p-6 text-center text-sm text-slate-500">No assessment requests yet.</Card> : null}
    </div>
  )
}

export default AdminAssessmentRequests
