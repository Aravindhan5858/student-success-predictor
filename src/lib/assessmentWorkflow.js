export const ASSESSMENT_STATUS_TONES = {
  Requested: 'medium',
  Accepted: 'neutral',
  'In Progress': 'orange',
  Submitted: 'orange',
  Evaluated: 'purple',
  Published: 'low',
}

export function getAssessmentStatusTone(status) {
  return ASSESSMENT_STATUS_TONES[status] || 'neutral'
}

export function getAssessmentResultTone(resultStatus) {
  const normalized = String(resultStatus || '').toLowerCase()
  if (normalized === 'pass') {
    return 'low'
  }
  if (normalized === 'fail') {
    return 'high'
  }
  return 'neutral'
}

export function normalizeAssessmentStatus(status) {
  const value = String(status || '')
  if (!value) {
    return 'Requested'
  }
  if (value === 'Pending') {
    return 'Requested'
  }
  return value
}
