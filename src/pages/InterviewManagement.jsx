import { useMemo, useState } from 'react'
import ActionOption from '../components/ActionOption'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'

function InterviewManagement() {
  const { interviews, updateInterview, deleteInterview, addInterviewFeedback } = useAppContext()
  const [editingId, setEditingId] = useState('')
  const [feedbackId, setFeedbackId] = useState('')
  const [editForm, setEditForm] = useState({
    interviewType: 'Technical',
    interviewDateTime: '',
    meetingLink: '',
    status: 'Scheduled',
  })
  const [feedbackForm, setFeedbackForm] = useState({
    communication: 0,
    technicalSkills: 0,
    confidence: 0,
    remarks: '',
  })

  const sortedInterviews = useMemo(
    () => interviews.slice().sort((a, b) => Number(new Date(a.interviewDateTime)) - Number(new Date(b.interviewDateTime))),
    [interviews],
  )

  const handleStartEdit = (interview) => {
    setEditingId(interview._id)
    setEditForm({
      interviewType: interview.interviewType,
      interviewDateTime: new Date(interview.interviewDateTime).toISOString().slice(0, 16),
      meetingLink: interview.meetingLink,
      status: interview.status,
    })
  }

  const handleSave = async () => {
    await updateInterview(editingId, {
      interviewType: editForm.interviewType,
      interviewDateTime: new Date(editForm.interviewDateTime).toISOString(),
      meetingLink: editForm.meetingLink,
      status: editForm.status,
    })

    setEditingId('')
  }

  const handleDelete = async (id) => {
    await deleteInterview(id)
  }

  const handleStartFeedback = (interview) => {
    setFeedbackId(interview._id)
    setFeedbackForm({
      communication: Number(interview?.feedback?.communication || 0),
      technicalSkills: Number(interview?.feedback?.technicalSkills || 0),
      confidence: Number(interview?.feedback?.confidence || 0),
      remarks: interview?.feedback?.remarks || '',
    })
  }

  const handleSaveFeedback = async () => {
    const result = await addInterviewFeedback({
      interviewId: feedbackId,
      communication: Number(feedbackForm.communication),
      technicalSkills: Number(feedbackForm.technicalSkills),
      confidence: Number(feedbackForm.confidence),
      remarks: feedbackForm.remarks,
    })

    if (result.ok) {
      setFeedbackId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Interview Management</h2>
        <p className="text-sm text-slate-500">Edit, update and delete scheduled interviews.</p>
      </section>

      <Table headers={['Student Name', 'Date & Time', 'Type', 'Status', 'Actions']}>
        {sortedInterviews.map((interview) => (
          <tr key={interview._id} className="hover:bg-slate-50">
            <td className="px-4 py-4 font-medium text-slate-900">{interview.studentName}</td>
            <td className="px-4 py-4 text-slate-600">{new Date(interview.interviewDateTime).toLocaleString()}</td>
            <td className="px-4 py-4 text-slate-600">{interview.interviewType}</td>
            <td className="px-4 py-4">
              <Badge tone={interview.status === 'Completed' ? 'low' : 'medium'}>{interview.status}</Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <ActionOption tone="edit" onClick={() => handleStartEdit(interview)}>Edit</ActionOption>
                <ActionOption tone="neutral" onClick={() => handleStartFeedback(interview)}>Feedback</ActionOption>
                <ActionOption tone="delete" onClick={() => handleDelete(interview._id)}>Delete</ActionOption>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {!sortedInterviews.length ? (
        <Card className="p-6 text-center text-sm text-slate-500">No interviews available.</Card>
      ) : null}

      {editingId ? (
        <Card className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900">Edit Interview</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
              <select
                value={editForm.interviewType}
                onChange={(event) => setEditForm((previous) => ({ ...previous, interviewType: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Date & Time</label>
              <input
                type="datetime-local"
                value={editForm.interviewDateTime}
                onChange={(event) => setEditForm((previous) => ({ ...previous, interviewDateTime: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Meeting Link</label>
              <input
                type="url"
                value={editForm.meetingLink}
                onChange={(event) => setEditForm((previous) => ({ ...previous, meetingLink: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={editForm.status}
                onChange={(event) => setEditForm((previous) => ({ ...previous, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex gap-2 justify-end">
            <Button fullWidth={false} variant="outline" onClick={() => setEditingId('')}>Cancel</Button>
            <Button fullWidth={false} onClick={handleSave}>Save</Button>
          </div>
        </Card>
      ) : null}

      {feedbackId ? (
        <Card className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900">Interview Feedback</h3>
          <p className="mt-1 text-sm text-slate-500">Rate each criteria on a scale of 0 to 10.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Communication</label>
              <input
                type="number"
                min="0"
                max="10"
                value={feedbackForm.communication}
                onChange={(event) => setFeedbackForm((previous) => ({ ...previous, communication: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Technical Skills</label>
              <input
                type="number"
                min="0"
                max="10"
                value={feedbackForm.technicalSkills}
                onChange={(event) => setFeedbackForm((previous) => ({ ...previous, technicalSkills: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Confidence</label>
              <input
                type="number"
                min="0"
                max="10"
                value={feedbackForm.confidence}
                onChange={(event) => setFeedbackForm((previous) => ({ ...previous, confidence: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-2 block text-sm font-medium text-slate-700">Remarks</label>
              <textarea
                rows={3}
                value={feedbackForm.remarks}
                onChange={(event) => setFeedbackForm((previous) => ({ ...previous, remarks: event.target.value }))}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button fullWidth={false} variant="outline" onClick={() => setFeedbackId('')}>Cancel</Button>
            <Button fullWidth={false} onClick={handleSaveFeedback}>Save Feedback</Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export default InterviewManagement
