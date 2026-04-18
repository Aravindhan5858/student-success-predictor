import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function Profile() {
  const { currentUser, currentStudent, currentUserAccount, updateUserProfile } = useAppContext()
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUserAccount?.email) {
      setForm((previous) => ({ ...previous, email: currentUserAccount.email }))
    }
  }, [currentUserAccount])

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const result = await updateUserProfile(form)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setForm((previous) => ({ ...previous, password: '' }))
    setMessage('Profile updated successfully')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500">View account details and update profile settings.</p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Account Overview</h3>
            <p className="mt-1 text-sm text-slate-500">Current signed-in user details.</p>
          </div>
          <Badge tone={currentUser?.role === 'admin' ? 'neutral' : 'low'}>{currentUser?.role ?? 'user'}</Badge>
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
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900">Update Profile</h3>
        {currentUser?.role === 'admin' ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Admin profile editing is restricted. Student accounts can update email and password from this page.
          </p>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <FormInput
              id="profile-email"
              label="Email"
              type="email"
              placeholder="Enter new email"
              value={form.email}
              onChange={handleChange('email')}
              error=" "
            />
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
        )}
      </Card>
    </div>
  )
}

export default Profile
