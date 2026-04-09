import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import InputField from '../components/InputField'
import { useAppContext } from '../context/AppContext'

function Login() {
  const [loginType, setLoginType] = useState('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { loginUser } = useAppContext()

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const result = loginUser({
      username: form.username.trim(),
      password: form.password,
      loginType,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(result.redirectTo, { replace: true })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center sm:min-h-[calc(100vh-3rem)]">
        <Card className="grid w-full grid-cols-1 overflow-hidden md:grid-cols-2">
          <section className="hidden flex-col justify-between bg-indigo-600 p-10 text-white md:flex">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Branding</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">Welcome Back</h1>
              <p className="mt-4 text-indigo-100">Sign in and continue building your success journey.</p>
            </div>
            <div className="relative mt-10 h-56 rounded-xl border border-white/20 bg-white/10 p-6">
              <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-white/20" />
              <div className="absolute right-8 top-4 h-16 w-16 rounded-full bg-cyan-300/50" />
              <div className="absolute bottom-8 left-12 h-28 w-40 rounded-xl bg-indigo-300/40" />
            </div>
          </section>

          <section className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Login</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your credentials to continue</p>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin')
                  setError('')
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  loginType === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('student')
                  setError('')
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  loginType === 'student' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                Student Login
              </button>
            </div>

            {loginType === 'admin' ? (
              <p className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                Username: <span className="font-semibold">admin</span> / Password:{' '}
                <span className="font-semibold">admin123</span>
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
                Student username = student name (ex: <span className="font-semibold">Aarav Patel</span>) and password =
                studentname + birthyear (ex: <span className="font-semibold">aaravpatel2005</span>)
              </p>
            )}

            <form className="mt-6 space-y-1" onSubmit={handleSubmit}>
              <InputField
                id="username"
                label={loginType === 'admin' ? 'Username' : 'Student Name / Username'}
                placeholder={loginType === 'admin' ? 'Enter admin username' : 'Enter student name'}
                value={form.username}
                onChange={handleChange('username')}
                error={error ? ' ' : ' '}
              />
              <InputField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange('password')}
                rightAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                }
                error={error || ' '}
              />

              <div className="flex items-center gap-4 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember Me
                </label>
              </div>

              <Button type="submit" className="mt-1">
                Login
              </Button>
            </form>
          </section>
        </Card>
      </div>
    </main>
  )
}

export default Login