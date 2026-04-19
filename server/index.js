import cors from 'cors'
import express from 'express'
import { Assessment, AssessmentSubmission } from './assessmentModels.js'
import { dbUtils, initDb } from './db.js'
import { Interview } from './interviewModel.js'
import { InterviewRequest } from './interviewRequestModel.js'
import { sendMockInterviewInvite } from './mailer.js'
import { connectMongo } from './mongo.js'
import { WorkflowRequest } from './workflowRequestModel.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const WORKFLOW_STATUSES = ['Requested', 'Accepted', 'In Progress', 'Submitted', 'Evaluated', 'Published', 'Pending', 'Rejected', 'Completed']

function toStudentMap(entries = []) {
  return new Map(
    (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry && entry.id)
      .map((entry) => [String(entry.id), entry]),
  )
}

function getAssessmentResultPayload(request) {
  return {
    score: Number(request?.score || 0),
    percentage: Number(request?.percentage || 0),
    resultStatus: request?.resultStatus || '',
    feedback: request?.feedback || '',
    publishedAt: request?.publishedAt || null,
  }
}

function buildEvaluationSummary(evaluation = [], fallbackScore = 0) {
  const rows = Array.isArray(evaluation) ? evaluation : []
  const maxScore = rows.reduce((sum, item) => sum + Number(item?.maxScore || 0), 0)
  const score = rows.reduce((sum, item) => sum + Number(item?.score || 0), 0)
  const derivedScore = maxScore > 0 ? score : Number(fallbackScore || 0)
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  return {
    score: derivedScore,
    percentage,
  }
}

async function loadAssessmentRequest(requestId) {
  return WorkflowRequest.findById(requestId)
}

async function loadAssessmentDetails(assessmentId) {
  if (!assessmentId) {
    return null
  }

  return Assessment.findById(assessmentId)
}

async function serializeStudentAssessmentRequest(request) {
  if (!request) {
    return null
  }

  const assessment = await loadAssessmentDetails(request.assessmentId)
  const plainRequest = request.toObject ? request.toObject() : request
  return {
    ...plainRequest,
    assessment: assessment ? assessment.toObject() : null,
    assessmentTitle: plainRequest.assessmentTitle || assessment?.title || plainRequest.title || '',
    totalMarks: Number(assessment?.totalMarks || 100),
  }
}

async function loadInterviewRequest(requestId) {
  return WorkflowRequest.findById(requestId)
}

function buildInterviewResultPayload({ technicalScore = 0, communication = 0, confidence = 0, remarks = '', feedback = '' } = {}) {
  const safeTechnical = Math.max(0, Math.min(100, Number(technicalScore || 0)))
  const safeCommunication = Math.max(0, Math.min(100, Number(communication || 0)))
  const safeConfidence = Math.max(0, Math.min(100, Number(confidence || 0)))
  const overallScore = Math.round((safeTechnical + safeCommunication + safeConfidence) / 3)

  return {
    technicalScore: safeTechnical,
    communication: safeCommunication,
    confidence: safeConfidence,
    overallScore,
    remarks,
    feedback,
  }
}

async function createInterviewWorkflowRequest(payload) {
  const {
    studentId,
    studentName,
    studentEmail = '',
    scheduledDate,
    meetingLink = '',
    interviewType = 'Technical',
    title = 'Interview Request',
  } = payload

  if (!studentId || !studentName || !scheduledDate || !meetingLink) {
    throw new Error('studentId, studentName, scheduledDate and meetingLink are required')
  }

  return WorkflowRequest.create({
    studentId: String(studentId),
    studentName,
    studentEmail,
    type: 'interview',
    senderRole: 'admin',
    receiverRole: 'student',
    title,
    scheduledDate: new Date(scheduledDate),
    meetingLink,
    interviewType,
    status: 'Pending',
    requestDate: new Date(),
  })
}

app.post('/api/request/interview', async (req, res) => {
  try {
    const request = await createInterviewWorkflowRequest(req.body)

    return res.status(201).json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to create interview request' })
  }
})

app.post('/api/interview/schedule', async (req, res) => {
  try {
    const request = await createInterviewWorkflowRequest(req.body)
    return res.status(201).json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to schedule interview request' })
  }
})

app.put('/api/interview/:id/accept', async (req, res) => {
  try {
    const request = await loadInterviewRequest(req.params.id)
    if (!request || request.type !== 'interview') {
      return res.status(404).json({ ok: false, message: 'Interview request not found' })
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Accepted', acceptedAt: new Date() },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to accept interview request' })
  }
})

app.put('/api/interview/:id/complete', async (req, res) => {
  try {
    const request = await loadInterviewRequest(req.params.id)
    if (!request || request.type !== 'interview') {
      return res.status(404).json({ ok: false, message: 'Interview request not found' })
    }

    const updates = {
      status: 'Completed',
      completedAt: new Date(),
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(req.params.id, updates, { new: true })
    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to mark interview completed' })
  }
})

app.post('/api/interview/:id/result', async (req, res) => {
  try {
    const request = await loadInterviewRequest(req.params.id)
    if (!request || request.type !== 'interview') {
      return res.status(404).json({ ok: false, message: 'Interview request not found' })
    }

    const resultPayload = buildInterviewResultPayload(req.body)
    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        completedAt: new Date(),
        result: {
          ...request.result,
          ...resultPayload,
          status: 'Completed',
        },
      },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to save interview result' })
  }
})

app.put('/api/interview/:id/publish', async (req, res) => {
  try {
    const request = await loadInterviewRequest(req.params.id)
    if (!request || request.type !== 'interview') {
      return res.status(404).json({ ok: false, message: 'Interview request not found' })
    }

    const mergedPayload = buildInterviewResultPayload({
      technicalScore: req.body?.technicalScore ?? request.result?.technicalScore,
      communication: req.body?.communication ?? request.result?.communication,
      confidence: req.body?.confidence ?? request.result?.confidence,
      remarks: req.body?.remarks ?? request.result?.remarks ?? '',
      feedback: req.body?.feedback ?? request.result?.feedback ?? '',
    })

    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Published',
        publishedAt: new Date(),
        result: {
          ...request.result,
          ...mergedPayload,
          status: 'Published',
          publishedAt: new Date(),
        },
      },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to publish interview result' })
  }
})

app.get('/api/student/:id/interviews', async (req, res) => {
  try {
    const requests = await WorkflowRequest.find({ studentId: String(req.params.id), type: 'interview' }).sort({ createdAt: -1 })
    return res.json(requests)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load student interviews' })
  }
})

app.post('/api/request/assessment', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail = '',
      assessmentId,
      title = 'Assessment Request',
      scheduledDate,
    } = req.body

    if (!studentId || !studentName || !assessmentId) {
      return res.status(400).json({ ok: false, message: 'studentId, studentName and assessmentId are required' })
    }

    const request = await WorkflowRequest.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      type: 'assessment',
      senderRole: 'admin',
      receiverRole: 'student',
      title,
      assessmentId: String(assessmentId),
      assessmentTitle: title,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'Requested',
      requestDate: new Date(),
    })

    return res.status(201).json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to create assessment request' })
  }
})

app.get('/api/requests', async (req, res) => {
  try {
    const { type } = req.query
    const filter = {}
    if (type === 'interview' || type === 'assessment') {
      filter.type = type
    }

    const requests = await WorkflowRequest.find(filter).sort({ createdAt: -1 })
    return res.json(requests)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load workflow requests' })
  }
})

app.get('/api/student/:id/requests', async (req, res) => {
  try {
    const requests = await WorkflowRequest.find({ studentId: String(req.params.id) }).sort({ createdAt: -1 })
    return res.json(requests)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load student requests' })
  }
})

app.get('/api/student/:id/assessments', async (req, res) => {
  try {
    const requests = await WorkflowRequest.find({ studentId: String(req.params.id), type: 'assessment' }).sort({ createdAt: -1 })
    const payload = await Promise.all(requests.map((request) => serializeStudentAssessmentRequest(request)))
    return res.json(payload.filter(Boolean))
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load student assessments' })
  }
})

app.put('/api/request/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!WORKFLOW_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' })
    }

    const request = await WorkflowRequest.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Request not found' })
    }

    return res.json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to update request status' })
  }
})

app.post('/api/assessment/create', async (req, res) => {
  try {
    const { title, description = '', totalMarks = 100, questions = [], assignedStudentIds = [] } = req.body

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Assessment title is required' })
    }

    const assessment = await Assessment.create({
      title,
      description,
      totalMarks: Number(totalMarks) || 100,
      assignedStudentIds: Array.isArray(assignedStudentIds) ? assignedStudentIds.map((id) => String(id)) : [],
      questions,
      status: 'active',
    })

    return res.status(201).json({ ok: true, assessment })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to create assessment' })
  }
})

app.post('/api/assessment/request', async (req, res) => {
  try {
    const { studentId, studentName, studentEmail = '', assessmentId, assessmentTitle = '', title = '', scheduledDate = null } = req.body

    if (!studentId || !studentName || !assessmentId) {
      return res.status(400).json({ ok: false, message: 'studentId, studentName and assessmentId are required' })
    }

    const assessment = await loadAssessmentDetails(assessmentId)
    if (!assessment) {
      return res.status(404).json({ ok: false, message: 'Assessment not found' })
    }

    const request = await WorkflowRequest.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      type: 'assessment',
      senderRole: 'admin',
      receiverRole: 'student',
      title: title || assessmentTitle || assessment.title,
      assessmentId: String(assessment._id),
      assessmentTitle: title || assessmentTitle || assessment.title,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: 'Requested',
      requestDate: new Date(),
    })

    return res.status(201).json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to create assessment request' })
  }
})

app.put('/api/assessment/:id/accept', async (req, res) => {
  try {
    const request = await loadAssessmentRequest(req.params.id)
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Assessment request not found' })
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Accepted', acceptedAt: new Date() },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to accept assessment request' })
  }
})

app.put('/api/assessment/:id/submit', async (req, res) => {
  try {
    const { status = 'Submitted', answers = [] } = req.body
    const request = await loadAssessmentRequest(req.params.id)
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Assessment request not found' })
    }

    const allowed = ['In Progress', 'Submitted']
    const nextStatus = allowed.includes(status) ? status : 'Submitted'
    const updates = {
      status: nextStatus,
      answers: Array.isArray(answers) ? answers : [],
    }

    if (nextStatus === 'In Progress') {
      updates.startedAt = new Date()
    }

    if (nextStatus === 'Submitted') {
      updates.submittedAt = new Date()
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(req.params.id, updates, { new: true })
    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to submit assessment' })
  }
})

app.post('/api/assessment/:id/evaluate', async (req, res) => {
  try {
    const { evaluation = [], score = 0, percentage = null, resultStatus = '', feedback = '' } = req.body
    const request = await loadAssessmentRequest(req.params.id)
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Assessment request not found' })
    }

    const summary = buildEvaluationSummary(evaluation, score)
    const nextScore = Number(score ?? summary.score ?? 0)
    const nextPercentage = percentage === null || percentage === undefined || percentage === '' ? Number(summary.percentage || 0) : Number(percentage)
    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Evaluated',
        evaluation: Array.isArray(evaluation) ? evaluation : [],
        score: nextScore,
        percentage: nextPercentage,
        resultStatus: resultStatus || (nextPercentage >= 40 ? 'Pass' : 'Fail'),
        feedback,
        evaluatedAt: new Date(),
      },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to evaluate assessment' })
  }
})

app.post('/api/assessment/:id/publish', async (req, res) => {
  try {
    const { score = 0, percentage = 0, resultStatus = '', feedback = '' } = req.body
    const request = await loadAssessmentRequest(req.params.id)
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Assessment request not found' })
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Published',
        score: Number(score || request.score || 0),
        percentage: Number(percentage || request.percentage || 0),
        resultStatus: resultStatus || request.resultStatus || (Number(percentage || request.percentage || 0) >= 40 ? 'Pass' : 'Fail'),
        feedback,
        publishedAt: new Date(),
      },
      { new: true },
    )

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to publish assessment result' })
  }
})

app.post('/api/interview/result', async (req, res) => {
  try {
    const {
      requestId,
      technicalScore = 0,
      communication = 0,
      confidence = 0,
      remarks = '',
      feedback = '',
    } = req.body

    if (!requestId) {
      return res.status(400).json({ ok: false, message: 'requestId is required' })
    }

    const resultPayload = buildInterviewResultPayload({ technicalScore, communication, confidence, remarks, feedback })

    const request = await WorkflowRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'Completed',
        completedAt: new Date(),
        result: {
          ...resultPayload,
          status: 'Completed',
        },
      },
      { new: true },
    )

    if (!request) {
      return res.status(404).json({ ok: false, message: 'Request not found' })
    }

    return res.json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to save interview result' })
  }
})

app.post('/api/assessment/result', async (req, res) => {
  try {
    const { requestId, score = 0, percentage = 0, status = 'Pass', feedback = '' } = req.body

    if (!requestId) {
      return res.status(400).json({ ok: false, message: 'requestId is required' })
    }

    const safeScore = Math.max(0, Number(score || 0))
    const safePercentage = Math.max(0, Math.min(100, Number(percentage || 0)))
    const normalizedStatus = String(status || 'Pass')

    const request = await WorkflowRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'Published',
        result: {
          score: safeScore,
          percentage: safePercentage,
          feedback,
          status: normalizedStatus,
          publishedAt: new Date(),
        },
      },
      { new: true },
    )

    if (!request) {
      return res.status(404).json({ ok: false, message: 'Request not found' })
    }

    return res.json({ ok: true, request })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to publish assessment result' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/interview-request', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      contactNumber = '',
      preferredDate = '',
      preferredTime = '',
      interviewType = 'Technical',
      mode = 'online',
      topic = '',
      message = '',
    } = req.body

    if (!studentId || !studentName || !studentEmail) {
      return res.status(400).json({ ok: false, message: 'Student details are required' })
    }

    const requestDoc = await InterviewRequest.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      contactNumber,
      preferredDate,
      preferredTime,
      interviewType,
      mode,
      topic,
      message,
      status: 'new',
    })

    return res.status(201).json({ ok: true, request: requestDoc })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to submit interview request' })
  }
})

app.get('/api/interview-requests', async (_req, res) => {
  try {
    const requests = await InterviewRequest.find().sort({ createdAt: -1 })
    return res.json(requests)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load interview requests' })
  }
})

app.put('/api/interview-request/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['new', 'reviewed', 'scheduled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' })
    }

    const updated = await InterviewRequest.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!updated) {
      return res.status(404).json({ ok: false, message: 'Interview request not found' })
    }

    return res.json({ ok: true, request: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to update interview request status' })
  }
})

app.post('/api/interview-feedback', async (req, res) => {
  try {
    const { interviewId, communication, technicalSkills, confidence, remarks = '' } = req.body

    if (!interviewId) {
      return res.status(400).json({ ok: false, message: 'interviewId is required' })
    }

    const safeCommunication = Math.max(0, Math.min(10, Number(communication || 0)))
    const safeTechnical = Math.max(0, Math.min(10, Number(technicalSkills || 0)))
    const safeConfidence = Math.max(0, Math.min(10, Number(confidence || 0)))
    const overallScore = Math.round(((safeCommunication + safeTechnical + safeConfidence) / 30) * 100)

    const updated = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'Completed',
        feedback: {
          communication: safeCommunication,
          technicalSkills: safeTechnical,
          confidence: safeConfidence,
          overallScore,
          remarks,
        },
      },
      { new: true },
    )

    if (!updated) {
      return res.status(404).json({ ok: false, message: 'Interview not found' })
    }

    return res.json({ ok: true, interview: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to submit interview feedback' })
  }
})

app.post('/api/assessments', async (req, res) => {
  try {
    const { title, description = '', totalMarks = 100, assignedStudentIds = [], assignedStudents = [], questions = [] } = req.body

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Assessment title is required' })
    }

    const normalizedAssignedStudentIds = assignedStudentIds.map((id) => String(id))

    const assessment = await Assessment.create({
      title,
      description,
      totalMarks: Number(totalMarks) || 100,
      assignedStudentIds: normalizedAssignedStudentIds,
      questions,
      status: 'active',
    })

    return res.status(201).json({ ok: true, assessment })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to create assessment' })
  }
})

app.get('/api/assessments', async (req, res) => {
  try {
    const { studentId } = req.query
    let assessments

    if (studentId) {
      assessments = await Assessment.find({
        $or: [{ assignedStudentIds: { $size: 0 } }, { assignedStudentIds: String(studentId) }],
      }).sort({ createdAt: -1 })
    } else {
      assessments = await Assessment.find().sort({ createdAt: -1 })
    }

    return res.json(assessments)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load assessments' })
  }
})

app.get('/api/assessments/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
    if (!assessment) {
      return res.status(404).json({ ok: false, message: 'Assessment not found' })
    }

    return res.json(assessment)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load assessment' })
  }
})

app.delete('/api/assessments/:id', async (req, res) => {
  try {
    const removed = await Assessment.findByIdAndDelete(req.params.id)
    if (!removed) {
      return res.status(404).json({ ok: false, message: 'Assessment not found' })
    }

    await AssessmentSubmission.deleteMany({ assessmentId: String(req.params.id) })
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to delete assessment' })
  }
})

app.post('/api/assessment/submit', async (req, res) => {
  try {
    const { assessmentId, studentId, studentName, answers = [], requestId = '', status: nextStatus = 'Submitted' } = req.body

    if (!assessmentId || !studentId || !studentName) {
      return res.status(400).json({ ok: false, message: 'assessmentId, studentId and studentName are required' })
    }

    const assessment = await Assessment.findById(assessmentId)
    if (!assessment) {
      return res.status(404).json({ ok: false, message: 'Assessment not found' })
    }

    const totalQuestions = assessment.questions.length || 1
    let correctCount = 0

    assessment.questions.forEach((question, index) => {
      if ((answers[index] || '') === (question.correctAnswer || '')) {
        correctCount += 1
      }
    })

    const percentage = Math.round((correctCount / totalQuestions) * 100)
    const score = Math.round((percentage / 100) * (Number(assessment.totalMarks) || 100))
    const resultStatus = percentage >= 40 ? 'Passed' : 'Failed'

    const submission = await AssessmentSubmission.create({
      assessmentId: String(assessment._id),
      studentId: String(studentId),
      studentName,
      score,
      percentage,
      status: resultStatus,
      answers,
    })

    if (requestId) {
      await WorkflowRequest.findByIdAndUpdate(requestId, {
        status: nextStatus === 'In Progress' ? 'In Progress' : 'Submitted',
        answers,
        score,
        percentage,
      })
    }

    return res.status(201).json({ ok: true, submission })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to submit assessment' })
  }
})

app.get('/api/assessment/results/:studentId', async (req, res) => {
  try {
    const results = await AssessmentSubmission.find({ studentId: String(req.params.studentId) }).sort({ createdAt: -1 })
    return res.json(results)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load assessment results' })
  }
})

app.get('/api/student/:id/full-performance', async (req, res) => {
  try {
    const db = await initDb()
    const studentId = String(req.params.id)
    const numericStudentId = Number(studentId)

    const student = await db.get('SELECT * FROM students WHERE id = ?', numericStudentId)
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Student not found' })
    }

    const assessments = await AssessmentSubmission.find({ studentId }).sort({ createdAt: -1 })
    const interviews = await Interview.find({ studentId }).sort({ interviewDateTime: -1 })

    const latestAssessment = assessments[0]
    const latestInterview = interviews[0]

    const attendance = Number(student.attendance || 0)
    const marks = Number(student.marks || 0)
    const assignments = Number(student.marks || 0)
    const assessmentScore = Number(latestAssessment?.percentage || 0)
    const interviewScore = Number(latestInterview?.feedback?.overallScore || 0)

    const overallScore =
      attendance * 0.2 +
      marks * 0.3 +
      assessmentScore * 0.2 +
      interviewScore * 0.2 +
      assignments * 0.1

    const normalizedOverallScore = Math.round(Math.max(0, Math.min(100, overallScore)))
    const riskLevel = normalizedOverallScore < 60 ? 'High' : normalizedOverallScore < 80 ? 'Medium' : 'Low'

    return res.json({
      ok: true,
      student: {
        ...student,
        assignments,
        prediction: {
          score: normalizedOverallScore,
          riskLevel,
        },
        assessments: assessments.map((item) => ({
          testName: item.assessmentId,
          score: item.score,
          percentage: item.percentage,
          status: item.status,
          createdAt: item.createdAt,
        })),
        interviews: interviews.map((item) => ({
          type: item.interviewType,
          date: item.interviewDateTime,
          score: item.feedback?.overallScore || 0,
          feedback: item.feedback || {},
          status: item.status,
        })),
      },
      overallScore: normalizedOverallScore,
      riskLevel,
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load full performance' })
  }
})

app.post('/api/interviews', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      interviewDateTime,
      interviewType,
      meetingLink,
      notes = '',
    } = req.body

    if (!studentId || !studentName || !studentEmail || !interviewDateTime || !interviewType || !meetingLink) {
      return res.status(400).json({ ok: false, message: 'All required interview fields must be provided' })
    }

    const interview = await Interview.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      interviewDateTime: new Date(interviewDateTime),
      interviewType,
      meetingLink,
      notes,
      status: 'Scheduled',
    })

    let emailSent = false
    try {
      await sendMockInterviewInvite({
        studentName,
        studentEmail,
        interviewDateTime,
        interviewType,
        meetingLink,
      })

      emailSent = true
      interview.emailSent = true
      await interview.save()
    } catch {
      emailSent = false
    }

    return res.status(201).json({ ok: true, interview, emailSent })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to schedule interview' })
  }
})

app.get('/api/interviews', async (_req, res) => {
  try {
    const interviews = await Interview.find().sort({ interviewDateTime: 1 })
    return res.json(interviews)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load interviews' })
  }
})

app.get('/api/interviews/:studentId', async (req, res) => {
  try {
    const interviews = await Interview.find({ studentId: String(req.params.studentId) }).sort({ interviewDateTime: 1 })
    return res.json(interviews)
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to load student interviews' })
  }
})

app.put('/api/interviews/:id', async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.interviewDateTime) {
      payload.interviewDateTime = new Date(payload.interviewDateTime)
    }

    const updated = await Interview.findByIdAndUpdate(req.params.id, payload, { new: true })
    if (!updated) {
      return res.status(404).json({ ok: false, message: 'Interview not found' })
    }

    return res.json({ ok: true, interview: updated })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to update interview' })
  }
})

app.delete('/api/interviews/:id', async (req, res) => {
  try {
    const removed = await Interview.findByIdAndDelete(req.params.id)
    if (!removed) {
      return res.status(404).json({ ok: false, message: 'Interview not found' })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to delete interview' })
  }
})

app.get('/api/students', async (_req, res) => {
  const db = await initDb()
  const students = await db.all('SELECT * FROM students ORDER BY id ASC')
  res.json(students)
})

app.post('/api/students', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword, getRiskLevel, calculatePredictedScore } = dbUtils()

  const { name, birthYear, attendance, marks, interactionScore } = req.body
  const normalizedUsername = normalizeStudentName(name)

  if (!normalizedUsername) {
    return res.status(400).json({ ok: false, message: 'Student name is required' })
  }

  if (!birthYear || String(birthYear).length !== 4) {
    return res.status(400).json({ ok: false, message: 'Valid birth year is required' })
  }

  if (normalizedUsername === 'admin') {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const exists = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', normalizedUsername)
  if (exists) {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const generatedPassword = buildStudentPassword(name, birthYear)
  const numericAttendance = Number(attendance)
  const numericMarks = Number(marks)
  const numericInteraction = Number(interactionScore)
  const predictedScore = calculatePredictedScore(numericAttendance, numericMarks, numericInteraction)
  const riskLevel = getRiskLevel(predictedScore)

  const insertResult = await db.run(
    `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    name,
    String(birthYear),
    normalizedUsername,
    generatedPassword,
    numericAttendance,
    numericMarks,
    numericInteraction,
    riskLevel,
    predictedScore,
  )

  await db.run(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
    normalizedUsername,
    `${normalizedUsername}@example.com`,
    generatedPassword,
  )

  return res.status(201).json({ ok: true, id: insertResult.lastID, username: normalizedUsername, password: generatedPassword })
})

app.put('/api/students/:id', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword, getRiskLevel, calculatePredictedScore } = dbUtils()

  const studentId = Number(req.params.id)
  const previousStudent = await db.get('SELECT * FROM students WHERE id = ?', studentId)

  if (!previousStudent) {
    return res.status(404).json({ ok: false, message: 'Student not found' })
  }

  const { name, birthYear, attendance, marks, interactionScore } = req.body
  const nextUsername = normalizeStudentName(name)
  const nextPassword = buildStudentPassword(name, birthYear)

  const conflicting = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != (SELECT id FROM users WHERE username = ?)', nextUsername, previousStudent.username)
  if (conflicting) {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const numericAttendance = Number(attendance)
  const numericMarks = Number(marks)
  const numericInteraction = Number(interactionScore)
  const predictedScore = calculatePredictedScore(numericAttendance, numericMarks, numericInteraction)
  const riskLevel = getRiskLevel(predictedScore)

  await db.run(
    `UPDATE students
     SET name = ?, birthYear = ?, username = ?, password = ?, attendance = ?, marks = ?, interactionScore = ?, riskLevel = ?, predictedScore = ?
     WHERE id = ?`,
    name,
    String(birthYear),
    nextUsername,
    nextPassword,
    numericAttendance,
    numericMarks,
    numericInteraction,
    riskLevel,
    predictedScore,
    studentId,
  )

  await db.run(
    `UPDATE users
     SET username = ?, email = ?, password = ?
     WHERE username = ?`,
    nextUsername,
    `${nextUsername}@example.com`,
    nextPassword,
    previousStudent.username,
  )

  return res.json({ ok: true })
})

app.delete('/api/students/:id', async (req, res) => {
  const db = await initDb()
  const studentId = Number(req.params.id)
  const matched = await db.get('SELECT * FROM students WHERE id = ?', studentId)

  if (!matched) {
    return res.status(404).json({ ok: false, message: 'Student not found' })
  }

  await db.run('DELETE FROM students WHERE id = ?', studentId)
  await db.run('DELETE FROM users WHERE username = ?', matched.username)

  return res.json({ ok: true })
})

app.post('/api/auth/register', async (req, res) => {
  const db = await initDb()
  const { username, email, password } = req.body

  if (!username || !password || !email) {
    return res.status(400).json({ ok: false, message: 'All fields are required' })
  }

  const exists = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', username)
  if (exists || username.toLowerCase() === 'admin') {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  await db.run(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
    username,
    email,
    password,
  )

  const existingStudent = await db.get('SELECT id FROM students WHERE LOWER(username) = LOWER(?)', username)
  if (!existingStudent) {
    const attendance = 75
    const marks = 70
    const interactionScore = 72
    const { calculatePredictedScore, getRiskLevel } = dbUtils()
    const predictedScore = calculatePredictedScore(attendance, marks, interactionScore)

    await db.run(
      `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      username,
      '2005',
      username,
      password,
      attendance,
      marks,
      interactionScore,
      getRiskLevel(predictedScore),
      predictedScore,
    )
  }

  return res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword } = dbUtils()
  const { username, password, loginType = 'student' } = req.body

  if (loginType === 'admin') {
    if (!(username === 'admin' && password === 'admin123')) {
      return res.status(401).json({ ok: false, message: 'Invalid admin credentials' })
    }

    const authUser = { username: 'admin', role: 'admin', userId: 'ADMIN-001' }
    return res.json({ ok: true, user: authUser, redirectTo: '/dashboard' })
  }

  const normalizedInput = normalizeStudentName(username)
  const mappedStudent = await db.get(
    `SELECT * FROM students WHERE username = ? OR LOWER(name) = LOWER(?)`,
    normalizedInput,
    username.trim(),
  )

  if (!mappedStudent) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' })
  }

  const expectedPassword = buildStudentPassword(mappedStudent.name, mappedStudent.birthYear)
  const isLegacyPasswordValid = mappedStudent.password === password

  if (password !== expectedPassword && !isLegacyPasswordValid) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' })
  }

  const authUser = {
    username: mappedStudent.username,
    role: 'student',
    userId: `STU-${mappedStudent.id}`,
  }

  return res.json({ ok: true, user: authUser, redirectTo: '/student-dashboard' })
})

app.listen(port, async () => {
  await initDb()
  await connectMongo()
  console.log(`API running on http://localhost:${port}`)
})
