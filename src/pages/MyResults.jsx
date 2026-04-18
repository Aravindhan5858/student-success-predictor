import Badge from '../components/Badge'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function MyResults() {
  const { assessmentResults } = useAppContext()

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">My Results</h2>
        <p className="text-sm text-slate-500">Review your latest assessment outcomes.</p>
      </section>

      <Table headers={['Assessment ID', 'Score', 'Percentage', 'Status', 'Submitted At']}>
        {assessmentResults.map((result) => (
          <tr key={result._id} className="hover:bg-slate-50">
            <td className="px-4 py-4 font-medium text-slate-900">{result.assessmentId}</td>
            <td className="px-4 py-4 text-slate-600">{result.score}</td>
            <td className="px-4 py-4 text-slate-600">{result.percentage}%</td>
            <td className="px-4 py-4">
              <Badge tone={result.status === 'Passed' ? 'low' : 'high'}>{result.status}</Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{new Date(result.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </Table>

      {!assessmentResults.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No assessment results available yet.</Card>
      ) : null}
    </div>
  )
}

export default MyResults
