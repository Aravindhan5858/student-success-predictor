import { useMemo, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAppContext } from '../context/AppContext'

function AdminSendAssessment() {
  const { students, users, assessments, requestAssessment } = useAppContext()
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        id: String(student.id),
        name: student.name,
        email: users.find((user) => user.username === student.username)?.email || `${student.username}@student.local`,
      })),
    [students, users],
  )

  const handleSend = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const selectedStudent = studentOptions.find((student) => student.id === selectedStudentId)
    const selectedAssessment = assessments.find((assessment) => String(assessment._id) === String(selectedAssessmentId))

    if (!selectedStudent || !selectedAssessment) {
      setError('Select both student and assessment')
      return
    }

    const result = await requestAssessment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      assessmentId: String(selectedAssessment._id),
      assessmentTitle: selectedAssessment.title,
      title: selectedAssessment.title,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment request sent successfully')
    setSelectedAssessmentId('')
    setSelectedStudentId('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Send Assessment Request</h2>
        <p className="text-sm text-slate-500">Select a student and test to create a Pending workflow item.</p>
      </section>

      <Card className="p-6">
        <form className="space-y-5" onSubmit={handleSend}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Assessment</label>
              <select
                value={selectedAssessmentId}
                onChange={(event) => setSelectedAssessmentId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select assessment</option>
                {assessments.map((assessment) => (
                  <option key={assessment._id} value={assessment._id}>{assessment.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select student</option>
                {studentOptions.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false} className="px-6">Send Request</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminSendAssessment
