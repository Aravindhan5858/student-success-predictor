import { mongoose } from "@/lib/mongo";

const assessmentEvaluationSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    question: { type: String, default: "" },
    studentAnswer: { type: String, default: "" },
    correctAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
  },
  { _id: false },
);

const workflowRequestSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, default: "", trim: true, lowercase: true },
    type: {
      type: String,
      enum: ["interview", "assessment"],
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    senderRole: { type: String, enum: ["admin", "student"], default: "admin" },
    receiverRole: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Accepted",
        "In Progress",
        "Submitted",
        "Evaluated",
        "Published",
        "Pending",
        "Rejected",
        "Completed",
      ],
      default: "Requested",
      index: true,
    },
    requestDate: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    evaluatedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    scheduledDate: { type: Date, default: null },
    meetingLink: { type: String, default: "" },
    interviewType: { type: String, default: "Technical" },
    assessmentId: { type: String, default: "" },
    assessmentTitle: { type: String, default: "" },
    answers: { type: [String], default: [] },
    evaluation: { type: [assessmentEvaluationSchema], default: [] },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    resultStatus: { type: String, default: "" },
    feedback: { type: String, default: "" },
    result: {
      technical: { type: Number, default: 0 },
      technicalScore: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      feedback: { type: String, default: "" },
      remarks: { type: String, default: "" },
      status: { type: String, default: "" },
      publishedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

export const WorkflowRequest =
  mongoose.models.WorkflowRequest ||
  mongoose.model("WorkflowRequest", workflowRequestSchema);
