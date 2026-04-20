import { mongoose } from "@/lib/mongo";

const interviewRequestSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    contactNumber: { type: String, default: "" },
    preferredDate: { type: String, default: "" },
    preferredTime: { type: String, default: "" },
    interviewType: {
      type: String,
      enum: ["Technical", "HR"],
      default: "Technical",
    },
    mode: { type: String, default: "online" },
    topic: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewed", "scheduled"],
      default: "new",
    },
  },
  { timestamps: true },
);

export const InterviewRequest =
  mongoose.models.InterviewRequest ||
  mongoose.model("InterviewRequest", interviewRequestSchema);
