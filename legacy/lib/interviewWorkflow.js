export const INTERVIEW_STATUS_TONES = {
  Pending: 'medium',
  Accepted: 'neutral',
  Completed: 'purple',
  Published: 'low',
}

export function getInterviewStatusTone(status) {
  return INTERVIEW_STATUS_TONES[String(status || '')] || 'neutral'
}
