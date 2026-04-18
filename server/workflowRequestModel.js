import { mongoose } from './mongo.js'

const workflowRequestSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, default: '', trim: true, lowercase: true },
    type: { type: String, enum: ['interview', 'assessment'], required: true, index: true },
    title: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Published'],
      default: 'Pending',
      index: true,
    },
    requestDate: { type: Date, default: Date.now },
    scheduledDate: { type: Date, default: null },
    meetingLink: { type: String, default: '' },
    interviewType: { type: String, default: 'Technical' },
    assessmentId: { type: String, default: '' },
    result: {
      technicalScore: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      remarks: { type: String, default: '' },
      status: { type: String, default: '' },
      publishedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
)

export const WorkflowRequest =
  mongoose.models.WorkflowRequest || mongoose.model('WorkflowRequest', workflowRequestSchema)
