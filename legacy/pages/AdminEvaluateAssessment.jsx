import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Table from '../components/Table'
import { useAppContext } from '../context/AppContext'
import { getAssessmentStatusTone } from '../lib/assessmentWorkflow'

function AdminEvaluateAssessment() {
  const { id } = useParams()
  const { workflowRequests, getAssessmentById, evaluateAssessmentRequest, loadWorkflowRequests } = useAppContext()
  const [assessment, setAssessment] = useState(null)
  const [rows, setRows] = useState([])
  const [feedback, setFeedback] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const request = useMemo(
    () => workflowRequests.find((item) => String(item._id) === String(id) && item.type === 'assessment'),
    [workflowRequests, id],
  )

  useEffect(() => {
    loadWorkflowRequests('assessment')
  }, [id])

  useEffect(() => {
    const load = async () => {
      if (!request?.assessmentId) {
        return
      }

      try {
        const data = await getAssessmentById(request.assessmentId)
        setAssessment(data)
        const questionCount = data.questions?.length || 0
        const defaultMax = questionCount ? Math.round((Number(data.totalMarks || 100) / questionCount) * 100) / 100 : 0

        const nextRows = (data.questions || []).map((question, index) => ({
          questionIndex: index,
          question: question.question,
          studentAnswer: request.answers?.[index] || '',
          correctAnswer: question.correctAnswer || '',
          isCorrect: request.answers?.[index] === question.correctAnswer,
          score: request.answers?.[index] === question.correctAnswer ? defaultMax : 0,
          maxScore: defaultMax,
          remarks: '',
        }))

        if (request.evaluation?.length) {
          setRows(request.evaluation)
        } else {
          setRows(nextRows)
        }
        setFeedback(request.feedback || '')
      } catch (loadError) {
        setError(loadError.message || 'Failed to load assessment')
      }
    }

    load()
  }, [request?.assessmentId, request?.evaluation, request?.answers])

  const totalScore = rows.reduce((sum, item) => sum + Number(item.score || 0), 0)
  const totalMax = rows.reduce((sum, item) => sum + Number(item.maxScore || 0), 0)
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  const handleRowChange = (index, field) => (event) => {
    const value = field === 'isCorrect' ? event.target.checked : event.target.value
    setRows((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === 'isCorrect' ? { score: value ? Number(item.maxScore || 0) : 0 } : {}),
            }
          : item,
      ),
    )
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!request) {
      setError('Assessment request not found')
      return
    }

    const result = await evaluateAssessmentRequest({
      requestId: request._id,
      evaluation: rows,
      score: totalScore,
      percentage,
      resultStatus: percentage >= 40 ? 'Pass' : 'Fail',
      feedback,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment evaluated successfully')
    await loadWorkflowRequests('assessment')
  }

  if (!request) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Assessment request not found.</p>
        <div className="mt-4">
          <Link to="/admin/assessment-requests">
            <Button fullWidth={false}>Back</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Evaluate Assessment</h2>
        <p className="text-sm text-slate-500">Student: {request.studentName}</p>
        <Badge tone={getAssessmentStatusTone(request.status)}>{request.status}</Badge>
      </section>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Assessment</p>
            <p>{assessment?.title || request.assessmentTitle || request.title || request.assessmentId}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Score</p>
            <p>{totalScore}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Percentage</p>
            <p>{percentage}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <Table headers={['Question', 'Student Answer', 'Correct', 'Mark Correct', 'Score', 'Max Score']}>
          {rows.map((row, index) => (
            <tr key={`${row.questionIndex}-${index}`}>
              <td className="px-4 py-4 text-slate-100">{row.question}</td>
              <td className="px-4 py-4 text-slate-100">{row.studentAnswer || '-'}</td>
              <td className="px-4 py-4 text-slate-100">{row.correctAnswer || '-'}</td>
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={Boolean(row.isCorrect)}
                  onChange={handleRowChange(index, 'isCorrect')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              <td className="px-4 py-4">
                <input
                  type="number"
                  min="0"
                  value={row.score}
                  onChange={handleRowChange(index, 'score')}
                  className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </td>
              <td className="px-4 py-4 text-slate-100">{row.maxScore}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="p-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Feedback</label>
        <textarea
          rows={4}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </Card>

      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="flex justify-end">
        <Button fullWidth={false} className="px-6" onClick={handleSave}>Save Evaluation</Button>
      </div>
    </div>
  )
}

export default AdminEvaluateAssessment
