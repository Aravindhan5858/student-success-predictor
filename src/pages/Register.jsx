import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import InputField from '../components/InputField'
import { useAppContext } from '../context/AppContext'

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { registerUser } = useAppContext()

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const result = await registerUser({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-xl items-center sm:min-h-[calc(100vh-3rem)]">
        <Card className="w-full p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Sign up with your details below</p>

          <form className="mt-6 space-y-1" onSubmit={handleSubmit}>
            <InputField
              id="register-username"
              label="Username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange('username')}
              error=" "
            />
            <InputField
              id="register-email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange('email')}
              error=" "
            />
            <InputField
              id="register-password"
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange('password')}
              error=" "
            />
            <InputField
              id="register-confirm-password"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={error || ' '}
            />

            <Button type="submit" className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 transition hover:text-indigo-700">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}

export default Register