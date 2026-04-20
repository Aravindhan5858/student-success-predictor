import Badge from '../components/Badge'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getAssessmentResultTone } from '../lib/assessmentWorkflow'

function MyResults() {
  const { studentAssessmentRequests, studentInterviewRequests } = useAppContext()

  const publishedAssessmentResults = studentAssessmentRequests.filter((request) => request.status === 'Published')

  const publishedInterviewResults = studentInterviewRequests.filter(
    (request) => request.type === 'interview' && request.status === 'Published',
  )

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">My Results</h2>
        <p className="text-sm text-slate-500">Review your published assessment and interview outcomes.</p>
      </section>

      <Card className="p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Assessment Results</h3>
        <Table headers={['Assessment', 'Score', 'Percentage', 'Status', 'Feedback', 'Published At']}>
          {publishedAssessmentResults.map((result) => (
            <tr key={result._id} className="hover:bg-slate-50">
              <td className="px-4 py-4 font-medium text-slate-900">{result.assessmentTitle || result.title || result.assessment?.title || result.assessmentId}</td>
              <td className="px-4 py-4 text-slate-600">{result.score ?? result.result?.score ?? 0}</td>
              <td className="px-4 py-4 text-slate-600">{Number(result.percentage ?? result.result?.percentage ?? 0)}%</td>
              <td className="px-4 py-4">
                <Badge tone={getAssessmentResultTone(result.resultStatus || result.result?.status || result.status)}>
                  {result.resultStatus || result.result?.status || 'Published'}
                </Badge>
              </td>
              <td className="px-4 py-4 text-slate-600">{result.feedback || result.result?.feedback || '-'}</td>
              <td className="px-4 py-4 text-slate-600">
                {result.publishedAt
                  ? new Date(result.publishedAt).toLocaleString()
                  : result.result?.publishedAt
                    ? new Date(result.result.publishedAt).toLocaleString()
                  : result.createdAt
                    ? new Date(result.createdAt).toLocaleString()
                    : '-'}
              </td>
            </tr>
          ))}
        </Table>

        {!publishedAssessmentResults.length ? (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">No assessment results available yet.</Card>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Interview Results</h3>
        <Table headers={['Type', 'Technical', 'Communication', 'Confidence', 'Overall', 'Status']}>
          {publishedInterviewResults.map((result) => (
            <tr key={result._id} className="hover:bg-slate-50">
              <td className="px-4 py-4 font-medium text-slate-900">{result.interviewType || 'Technical'}</td>
              <td className="px-4 py-4 text-slate-600">{result.result?.technicalScore ?? 0}</td>
              <td className="px-4 py-4 text-slate-600">{result.result?.communication ?? 0}</td>
              <td className="px-4 py-4 text-slate-600">{result.result?.confidence ?? 0}</td>
              <td className="px-4 py-4 font-semibold text-slate-900">{result.result?.overallScore ?? 0}%</td>
              <td className="px-4 py-4">
                <Badge tone="low">{result.status}</Badge>
              </td>
            </tr>
          ))}
        </Table>

        {!publishedInterviewResults.length ? (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">No interview results available yet.</Card>
        ) : null}
      </Card>
    </div>
  )
}

export default MyResults
