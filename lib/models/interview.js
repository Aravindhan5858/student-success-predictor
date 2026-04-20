import { mongoose } from "@/lib/mongo";

const interviewSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    interviewDateTime: { type: Date, required: true },
    interviewType: { type: String, enum: ["Technical", "HR"], required: true },
    meetingLink: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Scheduled", "Completed"],
      default: "Scheduled",
    },
    feedback: {
      communication: { type: Number, min: 0, max: 10, default: 0 },
      technicalSkills: { type: Number, min: 0, max: 10, default: 0 },
      confidence: { type: Number, min: 0, max: 10, default: 0 },
      overallScore: { type: Number, min: 0, max: 100, default: 0 },
      remarks: { type: String, default: "" },
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Interview =
  mongoose.models.Interview || mongoose.model("Interview", interviewSchema);
