import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'
import { getAssessmentResultTone, getAssessmentStatusTone } from '../lib/assessmentWorkflow'

function AdminPublishResult() {
  const { id } = useParams()
  const { workflowRequests, publishAssessmentRequest, loadWorkflowRequests } = useAppContext()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    score: 0,
    percentage: 0,
    resultStatus: 'Pass',
    feedback: '',
  })

  const request = useMemo(
    () => workflowRequests.find((item) => String(item._id) === String(id) && item.type === 'assessment'),
    [workflowRequests, id],
  )

  useEffect(() => {
    loadWorkflowRequests('assessment')
  }, [id])

  useEffect(() => {
    if (request) {
      setForm({
        score: Number(request.score || 0),
        percentage: Number(request.percentage || 0),
        resultStatus: request.resultStatus || 'Pass',
        feedback: request.feedback || '',
      })
    }
  }, [request])

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!request) {
      setError('Assessment request not found')
      return
    }

    const result = await publishAssessmentRequest({
      requestId: request._id,
      score: Number(form.score || 0),
      percentage: Number(form.percentage || 0),
      resultStatus: form.resultStatus,
      feedback: form.feedback,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment result published successfully')
    await loadWorkflowRequests('assessment')
  }

  if (!request) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Assessment request not found. Return to requests.</p>
        <div className="mt-4">
          <Link to="/admin/assessment-requests">
            <Button fullWidth={false}>Back</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Publish Result</h2>
        <p className="text-sm text-slate-500">Student: {request.studentName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={getAssessmentStatusTone(request.status)}>{request.status}</Badge>
          <Badge tone={getAssessmentResultTone(request.resultStatus)}>{request.resultStatus || 'Pending'}</Badge>
        </div>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput id="score" label="Final Score" type="number" min="0" value={form.score} onChange={handleChange('score')} error=" " />
            <FormInput id="percentage" label="Percentage" type="number" min="0" max="100" value={form.percentage} onChange={handleChange('percentage')} error=" " />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Pass / Fail</label>
            <select value={form.resultStatus} onChange={handleChange('resultStatus')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Feedback</label>
            <textarea
              rows={4}
              value={form.feedback}
              onChange={handleChange('feedback')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false}>Publish Result</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminPublishResult
