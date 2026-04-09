import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdvancedFeatureCard from '../components/AdvancedFeatureCard'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function AddStudent() {
  const navigate = useNavigate()
  const { addStudent } = useAppContext()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    birthYear: '',
    attendance: '',
    marks: '',
    interactionScore: '',
  })
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const result = addStudent(form)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setCreatedCredentials({ username: result.username, password: result.password })
    setForm({
      name: '',
      birthYear: '',
      attendance: '',
      marks: '',
      interactionScore: '',
    })

    setTimeout(() => navigate('/students'), 900)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add Student</h2>
          <p className="mt-1 text-sm text-slate-500">Capture academic metrics for prediction analysis</p>
          <p className="mt-2 text-xs text-indigo-700">Username is generated from student name and password is studentname + birthyear.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <FormInput id="name" label="Name" placeholder="Student name" value={form.name} onChange={handleChange('name')} />
          <FormInput
            id="birth-year"
            label="Birth Year"
            type="number"
            placeholder="Ex: 2005"
            value={form.birthYear}
            onChange={handleChange('birthYear')}
          />
          <FormInput
            id="attendance"
            label="Attendance"
            type="number"
            placeholder="Attendance %"
            value={form.attendance}
            onChange={handleChange('attendance')}
          />
          <FormInput id="marks" label="Marks" type="number" placeholder="Marks %" value={form.marks} onChange={handleChange('marks')} />
          <FormInput
            id="interaction"
            label="Classroom Interaction"
            type="number"
            placeholder="Interaction score %"
            value={form.interactionScore}
            onChange={handleChange('interactionScore')}
            error={error || ' '}
          />

          {createdCredentials ? (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 md:col-span-2">
              Created Student Login → Username: <span className="font-semibold">{createdCredentials.username}</span> | Password:{' '}
              <span className="font-semibold">{createdCredentials.password}</span>
            </div>
          ) : null}

          <div className="mt-2 md:col-span-2 md:justify-self-end">
            <Button type="submit" fullWidth={false} className="px-6">
              Submit Student
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <AdvancedFeatureCard
          title="Advanced Onboarding"
          description="Improve data quality during student profile creation."
          points={[
            'Standardize numeric inputs for attendance, marks, and interaction.',
            'Use generated credentials for secure first-time student login.',
            'Capture complete baseline data before running prediction workflows.',
          ]}
          tone="medium"
        />
      </div>
    </div>
  )
}

export default AddStudent
