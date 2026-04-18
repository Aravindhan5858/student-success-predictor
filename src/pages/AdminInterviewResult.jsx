import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function AdminInterviewResult() {
  const { id } = useParams()
  const { workflowRequests, loadWorkflowRequests, updateWorkflowRequestStatus, publishInterviewResult } = useAppContext()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    technicalScore: 0,
    communication: 0,
    confidence: 0,
    remarks: '',
  })

  const request = useMemo(
    () => workflowRequests.find((item) => String(item._id) === String(id) && item.type === 'interview'),
    [workflowRequests, id],
  )

  const overallScore = useMemo(() => {
    return Math.round((Number(form.technicalScore || 0) + Number(form.communication || 0) + Number(form.confidence || 0)) / 3)
  }, [form])

  useEffect(() => {
    loadWorkflowRequests('interview')
  }, [])

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const markCompleted = await updateWorkflowRequestStatus(id, 'Completed')
    if (!markCompleted.ok) {
      setError(markCompleted.message)
      return
    }

    const result = await publishInterviewResult({
      requestId: id,
      technicalScore: Number(form.technicalScore || 0),
      communication: Number(form.communication || 0),
      confidence: Number(form.confidence || 0),
      remarks: form.remarks,
      feedback: form.remarks,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Interview result published successfully')
  }

  if (!request) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Interview request not found. Go back to admin interviews.</p>
        <div className="mt-4">
          <Link to="/admin/interviews">
            <Button fullWidth={false}>Back</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Interview Result Entry</h2>
        <p className="text-sm text-slate-500">Student: {request.studentName}</p>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput id="tech-score" label="Technical Score" type="number" min="0" max="100" value={form.technicalScore} onChange={handleChange('technicalScore')} error=" " />
            <FormInput id="communication" label="Communication" type="number" min="0" max="100" value={form.communication} onChange={handleChange('communication')} error=" " />
            <FormInput id="confidence" label="Confidence" type="number" min="0" max="100" value={form.confidence} onChange={handleChange('confidence')} error=" " />
          </div>

          <Card className="p-4">
            <p className="text-sm text-slate-500">Overall Score (Auto)</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{overallScore}%</p>
          </Card>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Remarks</label>
            <textarea
              rows={4}
              value={form.remarks}
              onChange={handleChange('remarks')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false}>Save & Publish</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminInterviewResult
