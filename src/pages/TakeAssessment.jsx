import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAppContext } from '../context/AppContext'

function TakeAssessment() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''
  const { currentStudent, getAssessmentById, submitAssessment, submitAssessmentRequestResponse } = useAppContext()
  const [assessment, setAssessment] = useState(null)
  const [answers, setAnswers] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAssessmentById(id)
        setAssessment(data)
        setAnswers(new Array(data.questions?.length || 0).fill(''))
      } catch (loadError) {
        setError(loadError.message || 'Failed to load assessment')
      }
    }

    load()
  }, [id])

  const handleAnswerChange = (index) => (event) => {
    setAnswers((previous) => previous.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!currentStudent) {
      setError('Student profile not found')
      return
    }

    const result = requestId
      ? await submitAssessmentRequestResponse({
          assessmentId: id,
          studentId: String(currentStudent.id),
          studentName: currentStudent.name,
          answers,
          requestId,
        })
      : await submitAssessment({
          assessmentId: id,
          studentId: String(currentStudent.id),
          studentName: currentStudent.name,
          answers,
        })

    if (!result.ok) {
      setError(result.message)
      return
    }

    const percentage = result.data?.submission?.percentage ?? 0
    setMessage(`Assessment submitted successfully. Score: ${percentage}%`)
  }

  if (!assessment) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        {error || 'Loading assessment...'}
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Take Assessment</h2>
        <p className="text-sm text-slate-500">Complete the assessment and submit your answers.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900">{assessment.title}</h3>
        {assessment.description ? <p className="mt-1 text-sm text-slate-500">{assessment.description}</p> : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {(assessment.questions || []).map((question, index) => (
            <Card key={`${question.question}-${index}`} className="p-4">
              <p className="text-sm font-semibold text-slate-900">Q{index + 1}. {question.question}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(question.options || []).map((option, optionIndex) => {
                  const optionLabel = ['A', 'B', 'C', 'D'][optionIndex] || String(optionIndex + 1)
                  return (
                    <label key={`${option}-${optionLabel}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionLabel}
                        checked={answers[index] === optionLabel}
                        onChange={handleAnswerChange(index)}
                        className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {optionLabel}. {option}
                    </label>
                  )
                })}
              </div>
            </Card>
          ))}

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false} className="px-6">Submit Assessment</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TakeAssessment
