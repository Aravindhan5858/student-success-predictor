import { Link } from 'react-router-dom'
import ActionOption from '../components/ActionOption'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function Assessments() {
  const { assessments, deleteAssessment } = useAppContext()

  const handleDelete = async (assessmentId) => {
    await deleteAssessment(assessmentId)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Assessments</h2>
        <p className="text-sm text-slate-500">Manage created tests and student assignments.</p>
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Total Assessments: <span className="font-semibold text-slate-900">{assessments.length}</span>
          </p>
          <Link to="/create-assessment">
            <Button fullWidth={false} className="px-5">Create New Assessment</Button>
          </Link>
        </div>
      </Card>

      <Table headers={['Title', 'Total Marks', 'Assigned Students', 'Questions', 'Status', 'Actions']}>
        {assessments.map((assessment) => (
          <tr key={assessment._id} className="hover:bg-slate-50">
            <td className="px-4 py-4 font-medium text-slate-900">{assessment.title}</td>
            <td className="px-4 py-4 text-slate-600">{assessment.totalMarks}</td>
            <td className="px-4 py-4 text-slate-600">{assessment.assignedStudentIds?.length || 0}</td>
            <td className="px-4 py-4 text-slate-600">{assessment.questions?.length || 0}</td>
            <td className="px-4 py-4">
              <Badge tone={assessment.status === 'active' ? 'low' : 'neutral'}>{assessment.status}</Badge>
            </td>
            <td className="px-4 py-4">
              <ActionOption tone="delete" onClick={() => handleDelete(assessment._id)}>Delete</ActionOption>
            </td>
          </tr>
        ))}
      </Table>

      {!assessments.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No assessments created yet.</Card>
      ) : null}
    </div>
  )
}

export default Assessments
