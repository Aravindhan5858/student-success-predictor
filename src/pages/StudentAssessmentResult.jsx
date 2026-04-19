import { useEffect } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getAssessmentResultTone } from '../lib/assessmentWorkflow'

function StudentAssessmentResult() {
  const { currentStudent, studentAssessmentRequests, loadStudentAssessments } = useAppContext()

  useEffect(() => {
    if (currentStudent?.id) {
      loadStudentAssessments(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  const publishedResults = studentAssessmentRequests.filter(
    (request) => request.status === 'Published' && Number(request?.percentage ?? request?.result?.percentage ?? 0) >= 0,
  )

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Assessment Result</h2>
        <p className="text-sm text-slate-500">Published assessment scores and pass/fail status.</p>
      </section>

      <Table headers={['Test', 'Score', 'Percentage', 'Result', 'Published At']}>
        {publishedResults.map((item) => (
          <tr key={item._id}>
            <td className="px-4 py-4 text-slate-600">{item.assessmentTitle || item.title || item.assessment?.title || item.assessmentId}</td>
            <td className="px-4 py-4 text-slate-600">{item.score ?? item.result?.score ?? 0}</td>
            <td className="px-4 py-4 font-semibold text-slate-900">{Number(item.percentage ?? item.result?.percentage ?? 0)}%</td>
            <td className="px-4 py-4">
              <Badge tone={getAssessmentResultTone(item.resultStatus || item.result?.status)}>{item.resultStatus || item.result?.status || 'N/A'}</Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : item.result?.publishedAt ? new Date(item.result.publishedAt).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </Table>

      {!publishedResults.length ? <Card className="p-6 text-center text-sm text-slate-500">No published assessment result yet.</Card> : null}
    </div>
  )
}

export default StudentAssessmentResult
