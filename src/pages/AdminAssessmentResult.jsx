import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function AdminAssessmentResult() {
  const { id } = useParams()
  const { workflowRequests, loadWorkflowRequests, updateWorkflowRequestStatus, publishAssessmentResult } = useAppContext()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    score: 0,
    percentage: 0,
    status: 'Pass',
  })

  const request = useMemo(
    () => workflowRequests.find((item) => String(item._id) === String(id) && item.type === 'assessment'),
    [workflowRequests, id],
  )

  useEffect(() => {
    loadWorkflowRequests('assessment')
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

    const result = await publishAssessmentResult({
      requestId: id,
      score: Number(form.score || 0),
      percentage: Number(form.percentage || 0),
      status: form.status,
      feedback: `${form.status} - published`,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment result published successfully')
  }

  if (!request) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Assessment request not found. Return to admin assessments.</p>
        <div className="mt-4">
          <Link to="/admin/assessments">
            <Button fullWidth={false}>Back</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Assessment Result Entry</h2>
        <p className="text-sm text-slate-500">Student: {request.studentName}</p>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput id="score" label="Score" type="number" min="0" value={form.score} onChange={handleChange('score')} error=" " />
            <FormInput id="percentage" label="Percentage" type="number" min="0" max="100" value={form.percentage} onChange={handleChange('percentage')} error=" " />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={handleChange('status')} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
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

export default AdminAssessmentResult
