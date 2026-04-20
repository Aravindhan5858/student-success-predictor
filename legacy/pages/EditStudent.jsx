import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function EditStudent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { students, updateStudent } = useAppContext()

  const student = useMemo(() => students.find((item) => String(item.id) === String(id)), [id, students])

  const [form, setForm] = useState(() => ({
    name: student?.name ?? '',
    birthYear: student?.birthYear ?? '',
    attendance: student?.attendance ?? '',
    marks: student?.marks ?? '',
    interactionScore: student?.interactionScore ?? '',
    profilePhoto: student?.profilePhoto ?? '',
    address: student?.address ?? '',
    age: student?.age ?? '',
    bloodGroup: student?.bloodGroup ?? '',
    gender: student?.gender ?? '',
    mobileNumber: student?.mobileNumber ?? '',
  }))

  if (!student) {
    return <Navigate to="/students" replace />
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await updateStudent(student.id, form)
    navigate('/students')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="mb-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Edit Student</h2>
        <p className="text-sm text-slate-500">Update profile values to keep prediction inputs accurate.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Student Information</h3>
            <p className="mt-1 text-sm text-slate-500">Update student performance metrics</p>
          </div>
          <Link to="/students">
            <Button fullWidth={false} variant="outline">
              Cancel
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Profile Picture URL</label>
            <input
              type="text"
              value={form.profilePhoto}
              onChange={handleChange('profilePhoto')}
              placeholder="Paste image URL or base64"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <FormInput id="edit-name" label="Name" value={form.name} onChange={handleChange('name')} />
          <FormInput
            id="edit-birth-year"
            label="Birth Year"
            type="number"
            value={form.birthYear}
            onChange={handleChange('birthYear')}
          />
          <FormInput
            id="edit-attendance"
            label="Attendance"
            type="number"
            value={form.attendance}
            onChange={handleChange('attendance')}
          />
          <FormInput id="edit-marks" label="Marks" type="number" value={form.marks} onChange={handleChange('marks')} />
          <FormInput
            id="edit-interaction"
            label="Classroom Interaction"
            type="number"
            value={form.interactionScore}
            onChange={handleChange('interactionScore')}
          />

          <FormInput id="edit-address" label="Address" value={form.address} onChange={handleChange('address')} />
          <FormInput id="edit-age" label="Age" type="number" value={form.age} onChange={handleChange('age')} />
          <FormInput id="edit-blood" label="Blood Group" value={form.bloodGroup} onChange={handleChange('bloodGroup')} />
          <FormInput id="edit-gender" label="Gender" value={form.gender} onChange={handleChange('gender')} />
          <FormInput id="edit-mobile" label="Mobile Number" value={form.mobileNumber} onChange={handleChange('mobileNumber')} />

          <div className="md:col-span-2 md:justify-self-end">
            <Button type="submit" fullWidth={false} className="px-6">
              Update Student
            </Button>
          </div>
        </form>
      </Card>

    </div>
  )
}

export default EditStudent
