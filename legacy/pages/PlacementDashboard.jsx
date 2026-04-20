import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAppContext } from '../context/AppContext'

function PlacementDashboard() {
  const { students, interviews } = useAppContext()

  const now = Date.now()
  const upcomingInterviews = interviews.filter(
    (interview) => interview.status === 'Scheduled' && Number(new Date(interview.interviewDateTime)) >= now,
  )
  const completedInterviews = interviews.filter((interview) => interview.status === 'Completed')

  const cards = [
    { label: 'Eligible Students', value: students.length },
    { label: 'Upcoming Interviews', value: upcomingInterviews.length },
    { label: 'Completed Interviews', value: completedInterviews.length },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Placement Dashboard</h2>
        <p className="text-sm text-slate-500">Track interview pipeline and student placement readiness.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Interviews</h3>
            <Link to="/interviews" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingInterviews.slice(0, 5).map((interview) => (
              <div key={interview._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{interview.studentName}</p>
                  <Badge tone="medium">{interview.interviewType}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{new Date(interview.interviewDateTime).toLocaleString()}</p>
              </div>
            ))}

            {!upcomingInterviews.length ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">No upcoming interviews scheduled.</p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-slate-500">Manage interview scheduling and communication.</p>

          <div className="mt-4 space-y-3">
            <Link to="/schedule-interview" className="block">
              <Button>Schedule Interview</Button>
            </Link>
            <Link to="/interviews" className="block">
              <Button variant="outline">Manage Interviews</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default PlacementDashboard
