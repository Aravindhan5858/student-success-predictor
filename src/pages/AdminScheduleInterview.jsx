import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function AdminScheduleInterview() {
  const { students, users, sendInterviewRequest } = useAppContext()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    interviewDate: '',
    interviewTime: '',
    meetingLink: '',
    interviewType: 'Technical',
  })

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        id: String(student.id),
        name: student.name,
        email: users.find((user) => user.username === student.username)?.email || `${student.username}@student.local`,
      })),
    [students, users],
  )

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const selected = studentOptions.find((student) => student.id === String(form.studentId))
    if (!selected) {
      setError('Please select a student')
      return
    }

    if (!form.interviewDate || !form.interviewTime) {
      setError('Please choose date and time')
      return
    }

    const scheduledDate = new Date(`${form.interviewDate}T${form.interviewTime}`)

    const result = await sendInterviewRequest({
      studentId: selected.id,
      studentName: selected.name,
      studentEmail: selected.email,
      scheduledDate: scheduledDate.toISOString(),
      meetingLink: form.meetingLink,
      interviewType: form.interviewType,
      title: `${form.interviewType} Interview Request`,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Interview request sent successfully')
    setForm({
      studentId: '',
      interviewDate: '',
      interviewTime: '',
      meetingLink: '',
      interviewType: 'Technical',
    })

    setTimeout(() => {
      navigate('/admin/interviews')
    }, 700)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Schedule Interview</h2>
        <p className="text-sm text-slate-500">Send interview request to student with pending status.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
            <select
              value={form.studentId}
              onChange={handleChange('studentId')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Select student</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput id="interview-date" label="Date" type="date" value={form.interviewDate} onChange={handleChange('interviewDate')} error=" " />
            <FormInput id="interview-time" label="Time" type="time" value={form.interviewTime} onChange={handleChange('interviewTime')} error=" " />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
              <select
                value={form.interviewType}
                onChange={handleChange('interviewType')}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <FormInput
              id="meeting-link"
              label="Meeting Link"
              placeholder="https://meet.google.com/..."
              value={form.meetingLink}
              onChange={handleChange('meetingLink')}
              error=" "
            />
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false}>Send Interview Request</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminScheduleInterview
