import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ActionOption from '../components/ActionOption'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function AdminAssessments() {
  const { students, users, assessments, workflowRequests, loadWorkflowRequests, sendAssessmentRequest } = useAppContext()
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadWorkflowRequests('assessment')
  }, [])

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        id: String(student.id),
        name: student.name,
        email: users.find((user) => user.username === student.username)?.email || `${student.username}@student.local`,
      })),
    [students, users],
  )

  const assessmentRequests = workflowRequests.filter((request) => request.type === 'assessment')

  const handleSendRequest = async () => {
    setMessage('')
    setError('')

    const selectedStudent = studentOptions.find((student) => student.id === selectedStudentId)
    const selectedAssessment = assessments.find((assessment) => String(assessment._id) === String(selectedAssessmentId))

    if (!selectedStudent || !selectedAssessment) {
      setError('Select both assessment and student')
      return
    }

    const result = await sendAssessmentRequest({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      assessmentId: String(selectedAssessment._id),
      title: selectedAssessment.title,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment request sent')
    setSelectedAssessmentId('')
    setSelectedStudentId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Assessment Management</h2>
          <p className="text-sm text-slate-500">Create tests, send requests and publish results.</p>
        </div>
        <Link to="/create-assessment">
          <Button fullWidth={false}>Create Test</Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Assessment</label>
            <select value={selectedAssessmentId} onChange={(event) => setSelectedAssessmentId(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
              <option value="">Select assessment</option>
              {assessments.map((assessment) => (
                <option key={assessment._id} value={assessment._id}>{assessment.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
              <option value="">Select student</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          <Button fullWidth={false} onClick={handleSendRequest}>Send Request</Button>
        </div>
        {message ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <Table headers={['Sender', 'Receiver', 'Student', 'Assessment', 'Status', 'Request Date', 'Actions']}>
        {assessmentRequests.map((request) => (
          <tr key={request._id}>
            <td className="px-4 py-4 text-slate-600 capitalize">{request.senderRole || 'admin'}</td>
            <td className="px-4 py-4 text-slate-600 capitalize">{request.receiverRole || 'student'}</td>
            <td className="px-4 py-4 font-medium text-slate-900">{request.studentName}</td>
            <td className="px-4 py-4 text-slate-600">{request.title || request.assessmentId}</td>
            <td className="px-4 py-4">
              <Badge tone={request.status === 'Published' || request.status === 'Completed' ? 'low' : request.status === 'Accepted' ? 'neutral' : request.status === 'Rejected' ? 'high' : 'medium'}>
                {request.status}
              </Badge>
            </td>
            <td className="px-4 py-4 text-slate-600">{request.requestDate ? new Date(request.requestDate).toLocaleString() : '-'}</td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <ActionOption to={`/admin/assessment-result/${request._id}`} tone="view">View</ActionOption>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!assessmentRequests.length ? <Card className="p-6 text-center text-sm text-slate-500">No assessment requests yet.</Card> : null}
    </div>
  )
}

export default AdminAssessments
