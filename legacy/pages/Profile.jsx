import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function Profile() {
  const { currentUser, currentStudent, currentUserAccount, updateUserProfile, updateCurrentStudentProfile } = useAppContext()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    age: '',
    bloodGroup: '',
    gender: '',
    mobileNumber: '',
    profilePhoto: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const safeAttendance = Number(currentStudent?.attendance || 0)
  const safeMarks = Number(currentStudent?.marks || 0)
  const safeInteraction = Number(currentStudent?.interactionScore || 0)
  const safePredicted = Number(currentStudent?.predictedScore || 0)
  const completedProfile = currentStudent
    ? Math.min(100, Math.round((safeAttendance + safeMarks + safeInteraction) / 3))
    : 40

  const profileStats = [
    { label: 'Profile Completion', value: `${completedProfile}%` },
    { label: 'Attendance', value: `${safeAttendance}%` },
    { label: 'Marks', value: `${safeMarks}%` },
    { label: 'Predicted Score', value: `${safePredicted}%` },
  ]

  const activityItems = [
    {
      title: 'Next Review',
      subtitle:
        currentStudent?.riskLevel === 'High'
          ? 'Priority mentor review recommended'
          : currentStudent?.riskLevel === 'Medium'
            ? 'Weekly performance check scheduled'
            : 'Monthly performance review',
    },
    {
      title: 'Last Update',
      subtitle: currentStudent ? 'Student metrics recently synced' : 'Account setup in progress',
    },
    {
      title: 'Profile Status',
      subtitle: `${currentUser?.role === 'admin' ? 'Admin account' : 'Student account'} is active`,
    },
  ]

  useEffect(() => {
    setForm({
      name: currentStudent?.name || '',
      email: currentUserAccount?.email || '',
      password: '',
      address: currentStudent?.address || '',
      age: currentStudent?.age || '',
      bloodGroup: currentStudent?.bloodGroup || '',
      gender: currentStudent?.gender || '',
      mobileNumber: currentStudent?.mobileNumber || '',
      profilePhoto: currentStudent?.profilePhoto || '',
    })
  }, [currentStudent, currentUserAccount])

  const avatarSource = useMemo(() => currentStudent?.profilePhoto || '', [currentStudent?.profilePhoto])

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((previous) => ({ ...previous, profilePhoto: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const profileResult = await updateCurrentStudentProfile({
      name: form.name,
      address: form.address,
      age: form.age,
      bloodGroup: form.bloodGroup,
      gender: form.gender,
      mobileNumber: form.mobileNumber,
      profilePhoto: form.profilePhoto,
    })

    if (!profileResult.ok) {
      setError(profileResult.message)
      return
    }

    const accountResult = await updateUserProfile({ email: form.email, password: form.password })
    if (!accountResult.ok) {
      setError(accountResult.message)
      return
    }

    setForm((previous) => ({ ...previous, password: '' }))
    setMessage('Profile updated successfully')
    setIsEditing(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500">Personalized account dashboard with profile insights and settings.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-6 text-white sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Account Dashboard</p>
                  <h3 className="mt-2 text-2xl font-bold">Welcome back, {currentStudent?.name ?? currentUser?.username ?? 'User'}!</h3>
                  <p className="mt-2 text-sm text-indigo-100">Track profile strength and keep your personal details updated.</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/25 text-xl">
                    {avatarSource ? <img src={avatarSource} alt="Profile" className="h-full w-full object-cover" /> : '👤'}
                  </div>
                  <div>
                    <p className="text-xs text-indigo-100">Current Role</p>
                    <p className="text-sm font-semibold capitalize text-white">{currentUser?.role ?? 'user'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {profileStats.map((item) => (
                  <Card key={item.label} className="p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                  </Card>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Username</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{currentUser?.username ?? 'N/A'}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">User ID</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{currentUser?.userId ?? 'N/A'}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{currentStudent?.name ?? currentUser?.username ?? 'N/A'}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 break-all text-base font-semibold text-slate-900">{currentUserAccount?.email ?? 'Not available'}</p>
                </Card>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">Update Profile</h3>
              {currentUser?.role !== 'admin' ? (
                <Button type="button" fullWidth={false} variant="outline" onClick={() => setIsEditing((value) => !value)}>
                  {isEditing ? 'Close Edit' : 'Edit Profile'}
                </Button>
              ) : null}
            </div>
            {currentUser?.role === 'admin' ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Admin profile editing is restricted. Student accounts can update profile details from this page.
              </p>
            ) : isEditing ? (
              <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {form.profilePhoto ? <img src={form.profilePhoto} alt="Profile preview" className="h-full w-full object-cover" /> : <span className="text-4xl">👤</span>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                </div>

                <FormInput id="profile-name" label="Student Name" value={form.name} onChange={handleChange('name')} error=" " />
                <FormInput
                  id="profile-email"
                  label="Email"
                  type="email"
                  placeholder="Enter new email"
                  value={form.email}
                  onChange={handleChange('email')}
                  error=" "
                />
                <FormInput id="profile-address" label="Address" placeholder="Enter address" value={form.address} onChange={handleChange('address')} error=" " />
                <FormInput id="profile-age" label="Age" type="number" placeholder="Age" value={form.age} onChange={handleChange('age')} error=" " />
                <FormInput id="profile-blood" label="Blood Group" placeholder="A+ / B+ / O+" value={form.bloodGroup} onChange={handleChange('bloodGroup')} error=" " />
                <FormInput id="profile-gender" label="Gender" placeholder="Male / Female / Other" value={form.gender} onChange={handleChange('gender')} error=" " />
                <FormInput id="profile-mobile" label="Mobile Number" placeholder="Mobile number" value={form.mobileNumber} onChange={handleChange('mobileNumber')} error=" " />
                <FormInput
                  id="profile-password"
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange('password')}
                  error={error || ' '}
                />

                {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

                <div className="justify-self-end">
                  <Button type="submit" fullWidth={false} className="px-6">
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Card className="p-4 sm:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl text-slate-500">
                      {avatarSource ? <img src={avatarSource} alt="Profile" className="h-full w-full object-cover" /> : '👤'}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Profile Photo</p>
                      <p className="font-semibold text-slate-900">{currentStudent?.name || currentUser?.username || 'Student'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4"><p className="text-sm text-slate-500">Student Name</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.name || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Email</p><p className="mt-1 break-all font-semibold text-slate-900">{currentUserAccount?.email || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Address</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.address || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Age</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.age || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Blood Group</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.bloodGroup || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Gender</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.gender || 'N/A'}</p></Card>
                <Card className="p-4"><p className="text-sm text-slate-500">Mobile Number</p><p className="mt-1 font-semibold text-slate-900">{currentStudent?.mobileNumber || 'N/A'}</p></Card>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">My Activity</h3>
              <p className="mt-1 text-sm text-slate-500">Upcoming profile-related checkpoints.</p>
            </div>
            <Badge tone={currentStudent?.riskLevel?.toLowerCase?.() || 'neutral'}>
              {currentStudent?.riskLevel ? `${currentStudent.riskLevel} Risk` : 'Active'}
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {activityItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Current Completion</p>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                style={{ width: `${completedProfile}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">{completedProfile}% complete</p>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Profile
