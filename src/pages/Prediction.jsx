import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function Prediction() {
  const { students } = useAppContext()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [form, setForm] = useState({
    attendance: '',
    marks: '',
    interactionScore: '',
  })
  const [result, setResult] = useState({
    performance: 'Strong Performance',
    risk: 'Low',
    score: 89,
  })

  const [confidence, setConfidence] = useState(88)

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSelectStudent = (event) => {
    const studentId = event.target.value
    setSelectedStudentId(studentId)

    const selectedStudent = students.find((student) => String(student.id) === String(studentId))
    if (!selectedStudent) {
      return
    }

    setForm({
      attendance: String(selectedStudent.attendance ?? ''),
      marks: String(selectedStudent.marks ?? ''),
      interactionScore: String(selectedStudent.interactionScore ?? ''),
    })
  }

  const handlePredict = () => {
    const attendance = Number(form.attendance || 0)
    const marks = Number(form.marks || 0)
    const interactionScore = Number(form.interactionScore || 0)

    const weightedScore = Math.round(attendance * 0.35 + marks * 0.45 + interactionScore * 0.2)
    const boundedScore = Math.max(0, Math.min(100, weightedScore))
    const risk = boundedScore < 60 ? 'High' : boundedScore < 80 ? 'Medium' : 'Low'

    setResult({
      performance: boundedScore >= 80 ? 'Strong Performance' : boundedScore >= 60 ? 'Moderate Performance' : 'Needs Attention',
      risk,
      score: boundedScore,
    })
    setConfidence(Math.max(72, Math.min(97, Math.round((attendance + marks + interactionScore) / 3))))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Prediction</h2>
        <p className="text-sm text-slate-500">Generate a performance forecast from the latest student metrics.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Predict Student Performance</h3>
          <p className="mt-1 text-sm text-slate-500">Enter the latest academic indicators</p>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Select Student (Optional)</label>
            <select
              value={selectedStudentId}
              onChange={handleSelectStudent}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Enter values manually</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

        <div className="mt-6 space-y-5">
          <FormInput
            id="predict-attendance"
            label="Attendance"
            type="number"
            placeholder="Attendance %"
            value={form.attendance}
            onChange={handleChange('attendance')}
          />
          <FormInput
            id="predict-assignment"
            label="Marks"
            type="number"
            placeholder="Marks %"
            value={form.marks}
            onChange={handleChange('marks')}
          />
          <FormInput
            id="predict-interaction"
            label="Interaction Score"
            type="number"
            placeholder="Interaction score %"
            value={form.interactionScore}
            onChange={handleChange('interactionScore')}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button fullWidth={false} className="px-6" onClick={handlePredict}>
            Predict
          </Button>
        </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="text-sm font-medium text-slate-500">Prediction Result</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{result.performance}</h3>
            <p className="mt-2 text-sm text-slate-500">Clean summary of model output for the selected student profile.</p>
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Predicted Performance</span>
              <span className="text-2xl font-bold text-slate-900">{result.score}%</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Risk Level</span>
              <Badge tone={result.risk.toLowerCase()}>{result.risk}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Prediction Confidence</span>
              <Badge tone={confidence >= 90 ? 'low' : 'medium'}>{confidence}%</Badge>
            </div>
          </div>
        </Card>
      </div>

      {selectedStudentId ? (
        <div className="flex justify-end">
          <Link to={`/student/${selectedStudentId}`}>
            <Button fullWidth={false} variant="outline" className="px-5 py-2.5">Open Selected Student Profile</Button>
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default Prediction
