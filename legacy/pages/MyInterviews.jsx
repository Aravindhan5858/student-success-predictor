import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAppContext } from '../context/AppContext'

function MyInterviews() {
  const { studentInterviews } = useAppContext()

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">My Interviews</h2>
        <p className="text-sm text-slate-500">View your scheduled mock interviews and join using the meeting link.</p>
      </section>

      <section className="space-y-4">
        {studentInterviews.map((interview) => (
          <Card key={interview._id} className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{interview.interviewType} Interview</h3>
                <p className="mt-1 text-sm text-slate-600">{new Date(interview.interviewDateTime).toLocaleString()}</p>
                {interview.notes ? <p className="mt-2 text-sm text-slate-500">Notes: {interview.notes}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={interview.status === 'Completed' ? 'low' : 'medium'}>{interview.status}</Badge>
              </div>
            </div>

            <div className="mt-4">
              <a href={interview.meetingLink} target="_blank" rel="noreferrer">
                <Button fullWidth={false} className="px-5">Join Interview</Button>
              </a>
            </div>
          </Card>
        ))}

        {!studentInterviews.length ? (
          <Card className="p-6 text-center text-sm text-slate-500">No interviews assigned yet.</Card>
        ) : null}
      </section>
    </div>
  )
}

export default MyInterviews
