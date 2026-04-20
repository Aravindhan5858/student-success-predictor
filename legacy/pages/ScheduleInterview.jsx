import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function ScheduleInterview() {
  const { students, users, createInterview } = useAppContext()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    interviewDate: '',
    interviewTime: '',
    interviewType: 'Technical',
    meetingLink: '',
    notes: '',
  })

  useEffect(() => {
    const studentIdFromQuery = searchParams.get('studentId')
    if (studentIdFromQuery) {
      setForm((previous) => ({ ...previous, studentId: studentIdFromQuery }))
    }
  }, [searchParams])

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        name: student.name,
        username: student.username,
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

    const selected = studentOptions.find((student) => String(student.id) === String(form.studentId))
    if (!selected) {
      setError('Please select a student')
      return
    }

    if (!form.interviewDate || !form.interviewTime) {
      setError('Please select interview date and time')
      return
    }

    const interviewDateTime = new Date(`${form.interviewDate}T${form.interviewTime}`)

    const result = await createInterview({
      studentId: String(selected.id),
      studentName: selected.name,
      studentEmail: selected.email,
      interviewDateTime: interviewDateTime.toISOString(),
      interviewType: form.interviewType,
      meetingLink: form.meetingLink,
      notes: form.notes,
      status: 'Scheduled',
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    const emailSent = result.data?.emailSent
    setMessage(emailSent ? 'Interview scheduled and email invitation sent.' : 'Interview scheduled. Email could not be sent.')

    setForm({
      studentId: '',
      interviewDate: '',
      interviewTime: '',
      interviewType: 'Technical',
      meetingLink: '',
      notes: '',
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Schedule Interview</h2>
        <p className="text-sm text-slate-500">Schedule mock interviews and notify students via email + dashboard.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Student Name</label>
            <select
              value={form.studentId}
              onChange={handleChange('studentId')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            <FormInput id="interview-date" label="Interview Date" type="date" value={form.interviewDate} onChange={handleChange('interviewDate')} error=" " />
            <FormInput id="interview-time" label="Interview Time" type="time" value={form.interviewTime} onChange={handleChange('interviewTime')} error=" " />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
              <select
                value={form.interviewType}
                onChange={handleChange('interviewType')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <FormInput
              id="meeting-link"
              label="Meeting Link"
              placeholder="https://meet.google.com/... or Zoom link"
              value={form.meetingLink}
              onChange={handleChange('meetingLink')}
              error=" "
            />
          </div>

          <div>
            <label htmlFor="interview-notes" className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              id="interview-notes"
              rows={4}
              value={form.notes}
              onChange={handleChange('notes')}
              placeholder="Add preparation notes for student"
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="justify-self-end">
            <Button type="submit" fullWidth={false} className="px-6">Schedule Interview</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ScheduleInterview
