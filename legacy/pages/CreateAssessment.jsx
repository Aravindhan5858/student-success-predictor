import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function CreateAssessment() {
  const { students, users, createAssessment } = useAppContext()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    totalMarks: 100,
    assignedStudentIds: [],
  })

  const [questions, setQuestions] = useState([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
  ])

  useEffect(() => {
    const studentIdFromQuery = searchParams.get('studentId')
    if (studentIdFromQuery) {
      setForm((previous) => ({
        ...previous,
        assignedStudentIds: previous.assignedStudentIds.includes(studentIdFromQuery)
          ? previous.assignedStudentIds
          : [...previous.assignedStudentIds, studentIdFromQuery],
      }))
    }
  }, [searchParams])

  const handleFormChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const toggleStudent = (studentId) => {
    setForm((previous) => ({
      ...previous,
      assignedStudentIds: previous.assignedStudentIds.includes(studentId)
        ? previous.assignedStudentIds.filter((id) => id !== studentId)
        : [...previous.assignedStudentIds, studentId],
    }))
  }

  const handleQuestionChange = (index, field) => (event) => {
    setQuestions((previous) => previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: event.target.value } : item)))
  }

  const addQuestion = () => {
    setQuestions((previous) => [...previous, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }])
  }

  const removeQuestion = (index) => {
    setQuestions((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!form.title.trim()) {
      setError('Assessment title is required')
      return
    }

    const normalizedQuestions = questions
      .filter((item) => item.question.trim())
      .map((item) => ({
        question: item.question,
        options: [item.optionA, item.optionB, item.optionC, item.optionD],
        correctAnswer: item.correctAnswer,
      }))

    const assignedStudents = form.assignedStudentIds
      .map((studentId) => {
        const student = students.find((entry) => String(entry.id) === String(studentId))
        if (!student) {
          return null
        }

        const email = users.find((user) => user.username === student.username)?.email || `${student.username}@student.local`
        return {
          id: String(student.id),
          name: student.name,
          email,
        }
      })
      .filter(Boolean)

    const result = await createAssessment({
      title: form.title,
      description: form.description,
      totalMarks: Number(form.totalMarks) || 100,
      assignedStudentIds: form.assignedStudentIds.map(String),
      assignedStudents,
      questions: normalizedQuestions,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Assessment created successfully')
    setForm({ title: '', description: '', totalMarks: 100, assignedStudentIds: [] })
    setQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }])
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Create Assessment</h2>
        <p className="text-sm text-slate-500">Create and assign assessments to selected students.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput id="assessment-title" label="Assessment Title" value={form.title} onChange={handleFormChange('title')} error=" " />
            <FormInput id="assessment-total" label="Total Marks" type="number" value={form.totalMarks} onChange={handleFormChange('totalMarks')} error=" " />
          </div>

          <div>
            <label htmlFor="assessment-description" className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="assessment-description"
              rows={3}
              value={form.description}
              onChange={handleFormChange('description')}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Assign Students</p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {students.map((student) => (
                <label key={student.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.assignedStudentIds.includes(String(student.id))}
                    onChange={() => toggleStudent(String(student.id))}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {student.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Questions</h3>
              <Button type="button" fullWidth={false} variant="outline" className="px-3 py-2 text-xs" onClick={addQuestion}>
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={`question-${index}`} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Question {index + 1}</p>
                    {questions.length > 1 ? (
                      <Button type="button" fullWidth={false} variant="outline" className="px-3 py-1.5 text-xs" onClick={() => removeQuestion(index)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <FormInput id={`q-${index}`} label="Question" value={question.question} onChange={handleQuestionChange(index, 'question')} error=" " />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormInput id={`qa-${index}`} label="Option A" value={question.optionA} onChange={handleQuestionChange(index, 'optionA')} error=" " />
                      <FormInput id={`qb-${index}`} label="Option B" value={question.optionB} onChange={handleQuestionChange(index, 'optionB')} error=" " />
                      <FormInput id={`qc-${index}`} label="Option C" value={question.optionC} onChange={handleQuestionChange(index, 'optionC')} error=" " />
                      <FormInput id={`qd-${index}`} label="Option D" value={question.optionD} onChange={handleQuestionChange(index, 'optionD')} error=" " />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Correct Answer</label>
                      <select
                        value={question.correctAnswer}
                        onChange={handleQuestionChange(index, 'correctAnswer')}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" fullWidth={false} className="px-6">Create Assessment</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateAssessment
