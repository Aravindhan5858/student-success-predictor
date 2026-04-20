import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import FormInput from '../components/FormInput'
import { useAppContext } from '../context/AppContext'

function MockInterviewContact() {
  const { currentStudent, currentUserAccount, submitMockInterviewRequest } = useAppContext()
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    preferredDate: '',
    preferredTime: '',
    mode: 'online',
    topic: '',
    message: '',
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      fullName: currentStudent?.name ?? previous.fullName,
      contactNumber: currentUserAccount?.phone ?? previous.contactNumber,
    }))
  }, [currentStudent, currentUserAccount])

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    const result = await submitMockInterviewRequest(form)
    if (!result.ok) {
      setErrorMessage(result.message)
      return
    }

    setSuccessMessage('Your mock interview request has been submitted. Our team will contact you shortly.')
    setForm({
      fullName: currentStudent?.name ?? '',
      contactNumber: '',
      preferredDate: '',
      preferredTime: '',
      mode: 'online',
      topic: '',
      message: '',
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Mock Interview Contact</h2>
        <p className="text-sm text-slate-500">Book an online mock interview session and get mentor guidance.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <h3 className="text-xl font-bold text-slate-900">Request a Session</h3>
          <p className="mt-1 text-sm text-slate-500">Share your availability and interview focus area.</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="mock-full-name"
                label="Full Name"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange('fullName')}
                error=" "
              />
              <FormInput
                id="mock-contact"
                label="Contact Number"
                placeholder="Enter your number"
                value={form.contactNumber}
                onChange={handleChange('contactNumber')}
                error=" "
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="mock-date"
                label="Preferred Date"
                type="date"
                value={form.preferredDate}
                onChange={handleChange('preferredDate')}
                error=" "
              />
              <FormInput
                id="mock-time"
                label="Preferred Time"
                type="time"
                value={form.preferredTime}
                onChange={handleChange('preferredTime')}
                error=" "
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Interview Mode</label>
              <select
                value={form.mode}
                onChange={handleChange('mode')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="online">Online</option>
                <option value="phone">Phone Call</option>
                <option value="video">Video Call</option>
              </select>
            </div>

            <FormInput
              id="mock-topic"
              label="Interview Topic"
              placeholder="Ex: HR Round / Technical Round"
              value={form.topic}
              onChange={handleChange('topic')}
              error=" "
            />

            <div>
              <label htmlFor="mock-message" className="mb-2 block text-sm font-medium text-slate-700">
                Additional Notes
              </label>
              <textarea
                id="mock-message"
                rows={4}
                placeholder="Mention company role, language preference, and key support needed"
                value={form.message}
                onChange={handleChange('message')}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {successMessage ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
            {errorMessage ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

            <div className="justify-self-end">
              <Button type="submit" fullWidth={false} className="px-6">
                Submit Request
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900">Support Information</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2">Mock interviews are available Monday to Saturday.</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2">You will receive a confirmation call/message after submission.</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2">Bring your resume and role details for better guidance.</p>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default MockInterviewContact
