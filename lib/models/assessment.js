import { mongoose } from "@/lib/mongo";

const assessmentQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: "" },
  },
  { _id: false },
);

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    totalMarks: { type: Number, default: 100 },
    assignedStudentIds: { type: [String], default: [] },
    questions: { type: [assessmentQuestionSchema], default: [] },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true },
);

const assessmentSubmissionSchema = new mongoose.Schema(
  {
    assessmentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    status: { type: String, enum: ["Passed", "Failed"], required: true },
    answers: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);
export const AssessmentSubmission =
  mongoose.models.AssessmentSubmission ||
  mongoose.model("AssessmentSubmission", assessmentSubmissionSchema);
