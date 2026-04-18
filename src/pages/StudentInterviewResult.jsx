import { useEffect } from 'react'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function StudentInterviewResult() {
  const { currentStudent, studentInterviewRequests, loadStudentWorkflowRequests } = useAppContext()

  useEffect(() => {
    if (currentStudent?.id) {
      loadStudentWorkflowRequests(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  const publishedResults = studentInterviewRequests.filter(
    (request) => request.status === 'Published' && request.type === 'interview',
  )

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Interview Result</h2>
        <p className="text-sm text-slate-500">Published interview scores and feedback.</p>
      </section>

      <Table headers={['Type', 'Technical', 'Communication', 'Confidence', 'Overall', 'Status', 'Feedback']}>
        {publishedResults.map((item) => (
          <tr key={item._id}>
            <td className="px-4 py-4 text-slate-600">{item.interviewType || 'Technical'}</td>
            <td className="px-4 py-4 text-slate-600">{item.result?.technicalScore || 0}</td>
            <td className="px-4 py-4 text-slate-600">{item.result?.communication || 0}</td>
            <td className="px-4 py-4 text-slate-600">{item.result?.confidence || 0}</td>
            <td className="px-4 py-4 font-semibold text-slate-900">{item.result?.overallScore || 0}%</td>
            <td className="px-4 py-4">
              <Badge tone="low">{item.status}</Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{item.result?.remarks || '-'}</td>
          </tr>
        ))}
      </Table>

      {!publishedResults.length ? <Card className="p-6 text-center text-sm text-slate-500">No published interview result yet.</Card> : null}
    </div>
  )
}

export default StudentInterviewResult
