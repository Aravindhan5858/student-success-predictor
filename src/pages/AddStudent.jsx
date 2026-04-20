import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    address: '',
    age: '',
    bloodGroup: '',
    gender: '',
    mobileNumber: '',
    profilePhoto: '',
  })
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const result = await addStudent(form)
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
      address: '',
      age: '',
      bloodGroup: '',
      gender: '',
      mobileNumber: '',
      profilePhoto: '',
    })

    setTimeout(() => navigate('/students'), 900)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="mb-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Add Student</h2>
        <p className="text-sm text-slate-500">Create a new student profile with key learning metrics.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">Student Information</h3>
          <p className="mt-1 text-sm text-slate-500">Capture academic metrics for prediction analysis.</p>
          <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">Username is generated from student name and password is studentname + birthyear.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <FormInput id="photo" label="Profile Picture URL" placeholder="Paste image URL or base64" value={form.profilePhoto} onChange={handleChange('profilePhoto')} />
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

          <FormInput id="address" label="Address" placeholder="Address" value={form.address} onChange={handleChange('address')} />
          <FormInput id="age" label="Age" type="number" placeholder="Age" value={form.age} onChange={handleChange('age')} />
          <FormInput id="blood-group" label="Blood Group" placeholder="A+ / B+ / O+" value={form.bloodGroup} onChange={handleChange('bloodGroup')} />
          <FormInput id="gender" label="Gender" placeholder="Male / Female / Other" value={form.gender} onChange={handleChange('gender')} />
          <FormInput id="mobile-number" label="Mobile Number" placeholder="Mobile number" value={form.mobileNumber} onChange={handleChange('mobileNumber')} />

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

    </div>
  )
}

export default AddStudent
