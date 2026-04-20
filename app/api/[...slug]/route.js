import { NextResponse } from "next/server";
import { dbUtils, initDb } from "@/lib/db";
import { sendMockInterviewInvite } from "@/lib/mailer";
import { connectMongo } from "@/lib/mongo";
import {
  Assessment,
  AssessmentSubmission,
  Interview,
  InterviewRequest,
  WorkflowRequest,
} from "@/lib/models";

export const runtime = "nodejs";

const WORKFLOW_STATUSES = [
  "Requested",
  "Accepted",
  "In Progress",
  "Submitted",
  "Evaluated",
  "Published",
  "Pending",
  "Rejected",
  "Completed",
];

function json(payload, status = 200) {
  return NextResponse.json(payload, { status });
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getAssessmentResultPayload(request) {
  return {
    score: Number(request?.score || 0),
    percentage: Number(request?.percentage || 0),
    resultStatus: request?.resultStatus || "",
    feedback: request?.feedback || "",
    publishedAt: request?.publishedAt || null,
  };
}

function buildEvaluationSummary(evaluation = [], fallbackScore = 0) {
  const rows = Array.isArray(evaluation) ? evaluation : [];
  const maxScore = rows.reduce(
    (sum, item) => sum + Number(item?.maxScore || 0),
    0,
  );
  const score = rows.reduce((sum, item) => sum + Number(item?.score || 0), 0);
  const derivedScore = maxScore > 0 ? score : Number(fallbackScore || 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    score: derivedScore,
    percentage,
  };
}

async function loadAssessmentRequest(requestId) {
  return WorkflowRequest.findById(requestId);
}

async function loadAssessmentDetails(assessmentId) {
  if (!assessmentId) {
    return null;
  }

  return Assessment.findById(assessmentId);
}

async function serializeStudentAssessmentRequest(request) {
  if (!request) {
    return null;
  }

  const assessment = await loadAssessmentDetails(request.assessmentId);
  const plainRequest = request.toObject ? request.toObject() : request;
  return {
    ...plainRequest,
    assessment: assessment ? assessment.toObject() : null,
    assessmentTitle:
      plainRequest.assessmentTitle ||
      assessment?.title ||
      plainRequest.title ||
      "",
    totalMarks: Number(assessment?.totalMarks || 100),
  };
}

async function loadInterviewRequest(requestId) {
  return WorkflowRequest.findById(requestId);
}

function buildInterviewResultPayload({
  technical = null,
  technicalScore = 0,
  communication = 0,
  confidence = 0,
  remarks = "",
  feedback = "",
} = {}) {
  const safeTechnical = Math.max(
    0,
    Math.min(100, Number((technical ?? technicalScore) || 0)),
  );
  const safeCommunication = Math.max(
    0,
    Math.min(100, Number(communication || 0)),
  );
  const safeConfidence = Math.max(0, Math.min(100, Number(confidence || 0)));
  const overallScore = Math.round(
    (safeTechnical + safeCommunication + safeConfidence) / 3,
  );

  return {
    technical: safeTechnical,
    technicalScore: safeTechnical,
    communication: safeCommunication,
    confidence: safeConfidence,
    overall: overallScore,
    overallScore,
    remarks,
    feedback,
  };
}

async function createInterviewWorkflowRequest(payload) {
  const {
    studentId,
    studentName,
    studentEmail = "",
    scheduledDate,
    meetingLink = "",
    interviewType = "Technical",
    title = "Interview Request",
  } = payload;

  if (!studentId || !studentName || !scheduledDate || !meetingLink) {
    throw new Error(
      "studentId, studentName, scheduledDate and meetingLink are required",
    );
  }

  return WorkflowRequest.create({
    studentId: String(studentId),
    studentName,
    studentEmail,
    type: "interview",
    senderRole: "admin",
    receiverRole: "student",
    title,
    scheduledDate: new Date(scheduledDate),
    meetingLink,
    interviewType,
    status: "Pending",
    requestDate: new Date(),
  });
}

async function ensureMongo() {
  await connectMongo();
}

async function handleRequest(method, request, routeParams) {
  const slug = Array.isArray(routeParams?.slug) ? routeParams.slug : [];
  const url = new URL(request.url);
  const body =
    method === "GET" || method === "DELETE" ? {} : await parseBody(request);
  const [one, two, three, four] = slug;

  if (method === "GET" && one === "health") {
    return json({ ok: true });
  }

  if (method === "GET" && one === "users" && !two) {
    const db = await initDb();
    const users = await db.all("SELECT * FROM users ORDER BY id ASC");
    return json(users);
  }

  if (method === "PUT" && one === "users" && two) {
    const db = await initDb();
    const updates = [];
    const values = [];

    if (typeof body.email === "string") {
      updates.push("email = ?");
      values.push(body.email.trim());
    }

    if (typeof body.password === "string" && body.password.trim()) {
      updates.push("password = ?");
      values.push(body.password);
    }

    if (!updates.length) {
      return json({ ok: false, message: "No updates provided" }, 400);
    }

    values.push(Number(two));
    await db.run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      ...values,
    );

    const user = await db.get("SELECT * FROM users WHERE id = ?", Number(two));
    if (!user) {
      return json({ ok: false, message: "User not found" }, 404);
    }

    return json({ ok: true, user });
  }

  if (method === "GET" && one === "students" && !two) {
    const db = await initDb();
    const students = await db.all("SELECT * FROM students ORDER BY id ASC");
    return json(students);
  }

  if (method === "POST" && one === "students" && !two) {
    const db = await initDb();
    const {
      normalizeStudentName,
      buildStudentPassword,
      getRiskLevel,
      calculatePredictedScore,
    } = dbUtils();

    const {
      name,
      birthYear,
      attendance,
      marks,
      interactionScore,
      address = "",
      age = "",
      bloodGroup = "",
      gender = "",
      mobileNumber = "",
      profilePhoto = "",
    } = body;

    const normalizedUsername = normalizeStudentName(name);

    if (!normalizedUsername) {
      return json({ ok: false, message: "Student name is required" }, 400);
    }

    if (!birthYear || String(birthYear).length !== 4) {
      return json({ ok: false, message: "Valid birth year is required" }, 400);
    }

    if (normalizedUsername === "admin") {
      return json({ ok: false, message: "Username already exists" }, 400);
    }

    const exists = await db.get(
      "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
      normalizedUsername,
    );
    if (exists) {
      return json({ ok: false, message: "Username already exists" }, 400);
    }

    const generatedPassword = buildStudentPassword(name, birthYear);
    const numericAttendance = Number(attendance);
    const numericMarks = Number(marks);
    const numericInteraction = Number(interactionScore);
    const predictedScore = calculatePredictedScore(
      numericAttendance,
      numericMarks,
      numericInteraction,
    );
    const riskLevel = getRiskLevel(predictedScore);

    const insertResult = await db.run(
      `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore, address, age, bloodGroup, gender, mobileNumber, profilePhoto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      name,
      String(birthYear),
      normalizedUsername,
      generatedPassword,
      numericAttendance,
      numericMarks,
      numericInteraction,
      riskLevel,
      predictedScore,
      address,
      age,
      bloodGroup,
      gender,
      mobileNumber,
      profilePhoto,
    );

    await db.run(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
      normalizedUsername,
      `${normalizedUsername}@example.com`,
      generatedPassword,
    );

    return json(
      {
        ok: true,
        id: insertResult.lastID,
        username: normalizedUsername,
        password: generatedPassword,
      },
      201,
    );
  }

  if (method === "PUT" && one === "students" && two) {
    const db = await initDb();
    const {
      normalizeStudentName,
      buildStudentPassword,
      getRiskLevel,
      calculatePredictedScore,
    } = dbUtils();

    const studentId = Number(two);
    const previousStudent = await db.get(
      "SELECT * FROM students WHERE id = ?",
      studentId,
    );

    if (!previousStudent) {
      return json({ ok: false, message: "Student not found" }, 404);
    }

    const {
      name,
      birthYear,
      attendance,
      marks,
      interactionScore,
      address = previousStudent.address || "",
      age = previousStudent.age || "",
      bloodGroup = previousStudent.bloodGroup || "",
      gender = previousStudent.gender || "",
      mobileNumber = previousStudent.mobileNumber || "",
      profilePhoto = previousStudent.profilePhoto || "",
    } = body;

    const nextUsername = normalizeStudentName(name);
    const nextPassword = buildStudentPassword(name, birthYear);

    const conflicting = await db.get(
      "SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND username != ?",
      nextUsername,
      previousStudent.username,
    );

    if (conflicting) {
      return json({ ok: false, message: "Username already exists" }, 400);
    }

    const numericAttendance = Number(attendance);
    const numericMarks = Number(marks);
    const numericInteraction = Number(interactionScore);
    const predictedScore = calculatePredictedScore(
      numericAttendance,
      numericMarks,
      numericInteraction,
    );
    const riskLevel = getRiskLevel(predictedScore);

    await db.run(
      `UPDATE students
       SET name = ?, birthYear = ?, username = ?, password = ?, attendance = ?, marks = ?, interactionScore = ?, riskLevel = ?, predictedScore = ?, address = ?, age = ?, bloodGroup = ?, gender = ?, mobileNumber = ?, profilePhoto = ?
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
      address,
      age,
      bloodGroup,
      gender,
      mobileNumber,
      profilePhoto,
      studentId,
    );

    await db.run(
      `UPDATE users
       SET username = ?, email = ?, password = ?
       WHERE username = ?`,
      nextUsername,
      `${nextUsername}@example.com`,
      nextPassword,
      previousStudent.username,
    );

    return json({ ok: true });
  }

  if (method === "DELETE" && one === "students" && two) {
    const db = await initDb();
    const studentId = Number(two);
    const matched = await db.get(
      "SELECT * FROM students WHERE id = ?",
      studentId,
    );

    if (!matched) {
      return json({ ok: false, message: "Student not found" }, 404);
    }

    await db.run("DELETE FROM students WHERE id = ?", studentId);
    await db.run("DELETE FROM users WHERE username = ?", matched.username);

    return json({ ok: true });
  }

  if (method === "POST" && one === "auth" && two === "register") {
    const db = await initDb();
    const { username, email, password } = body;

    if (!username || !password || !email) {
      return json({ ok: false, message: "All fields are required" }, 400);
    }

    const exists = await db.get(
      "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
      username,
    );
    if (exists || username.toLowerCase() === "admin") {
      return json({ ok: false, message: "Username already exists" }, 400);
    }

    await db.run(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
      username,
      email,
      password,
    );

    const existingStudent = await db.get(
      "SELECT id FROM students WHERE LOWER(username) = LOWER(?)",
      username,
    );
    if (!existingStudent) {
      const attendance = 75;
      const marks = 70;
      const interactionScore = 72;
      const { calculatePredictedScore, getRiskLevel } = dbUtils();
      const predictedScore = calculatePredictedScore(
        attendance,
        marks,
        interactionScore,
      );

      await db.run(
        `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore, address, age, bloodGroup, gender, mobileNumber, profilePhoto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        username,
        "2005",
        username,
        password,
        attendance,
        marks,
        interactionScore,
        getRiskLevel(predictedScore),
        predictedScore,
        "",
        "",
        "",
        "",
        "",
        "",
      );
    }

    return json({ ok: true });
  }

  if (method === "POST" && one === "auth" && two === "login") {
    const db = await initDb();
    const { normalizeStudentName, buildStudentPassword } = dbUtils();
    const { username, password, loginType = "student" } = body;

    if (loginType === "admin") {
      if (!(username === "admin" && password === "admin123")) {
        return json({ ok: false, message: "Invalid admin credentials" }, 401);
      }

      const authUser = {
        username: "admin",
        role: "admin",
        userId: "ADMIN-001",
      };
      return json({ ok: true, user: authUser, redirectTo: "/dashboard" });
    }

    const normalizedInput = normalizeStudentName(username);
    const mappedStudent = await db.get(
      `SELECT * FROM students WHERE username = ? OR LOWER(name) = LOWER(?)`,
      normalizedInput,
      username.trim(),
    );

    if (!mappedStudent) {
      return json({ ok: false, message: "Invalid credentials" }, 401);
    }

    const expectedPassword = buildStudentPassword(
      mappedStudent.name,
      mappedStudent.birthYear,
    );
    const isLegacyPasswordValid = mappedStudent.password === password;

    if (password !== expectedPassword && !isLegacyPasswordValid) {
      return json({ ok: false, message: "Invalid credentials" }, 401);
    }

    const authUser = {
      username: mappedStudent.username,
      role: "student",
      userId: `STU-${mappedStudent.id}`,
    };

    return json({ ok: true, user: authUser, redirectTo: "/student-dashboard" });
  }

  if (
    one === "student" ||
    one === "request" ||
    one === "requests" ||
    one === "assessment" ||
    one === "assessments" ||
    one === "interview" ||
    one === "interviews" ||
    one === "interview-request" ||
    one === "interview-requests" ||
    one === "interview-feedback"
  ) {
    await ensureMongo();
  }

  if (method === "POST" && one === "request" && two === "interview") {
    const workflowRequest = await createInterviewWorkflowRequest(body);
    return json({ ok: true, request: workflowRequest }, 201);
  }

  if (method === "POST" && one === "interview" && two === "schedule") {
    const workflowRequest = await createInterviewWorkflowRequest(body);
    return json({ ok: true, request: workflowRequest }, 201);
  }

  if (method === "PUT" && one === "interview" && two && three === "accept") {
    const interviewRequest = await loadInterviewRequest(two);
    if (!interviewRequest || interviewRequest.type !== "interview") {
      return json({ ok: false, message: "Interview request not found" }, 404);
    }

    if (interviewRequest.status !== "Pending") {
      return json(
        {
          ok: false,
          message: "Only Pending interview requests can be accepted",
        },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      { status: "Accepted", acceptedAt: new Date() },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "PUT" && one === "interview" && two && three === "complete") {
    const interviewRequest = await loadInterviewRequest(two);
    if (!interviewRequest || interviewRequest.type !== "interview") {
      return json({ ok: false, message: "Interview request not found" }, 404);
    }

    if (
      interviewRequest.status !== "Accepted" &&
      interviewRequest.status !== "Completed"
    ) {
      return json(
        {
          ok: false,
          message: "Only Accepted interviews can be marked as Completed",
        },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      { status: "Completed", completedAt: new Date() },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "POST" && one === "interview" && two && three === "result") {
    const interviewRequest = await loadInterviewRequest(two);
    if (!interviewRequest || interviewRequest.type !== "interview") {
      return json({ ok: false, message: "Interview request not found" }, 404);
    }

    if (interviewRequest.status === "Published") {
      return json(
        { ok: false, message: "Published interview result cannot be edited" },
        409,
      );
    }

    if (
      interviewRequest.status !== "Accepted" &&
      interviewRequest.status !== "Completed"
    ) {
      return json(
        {
          ok: false,
          message: "Interview must be Accepted before saving result",
        },
        409,
      );
    }

    const resultPayload = buildInterviewResultPayload(body);
    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "Completed",
        completedAt: new Date(),
        result: {
          ...interviewRequest.result,
          ...resultPayload,
          status: "Completed",
        },
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "PUT" && one === "interview" && two && three === "publish") {
    const interviewRequest = await loadInterviewRequest(two);
    if (!interviewRequest || interviewRequest.type !== "interview") {
      return json({ ok: false, message: "Interview request not found" }, 404);
    }

    if (
      interviewRequest.status !== "Completed" &&
      interviewRequest.status !== "Published"
    ) {
      return json(
        {
          ok: false,
          message: "Only Completed interview results can be published",
        },
        409,
      );
    }

    const mergedPayload = buildInterviewResultPayload({
      technical: body?.technical ?? interviewRequest.result?.technical,
      technicalScore:
        body?.technicalScore ?? interviewRequest.result?.technicalScore,
      communication:
        body?.communication ?? interviewRequest.result?.communication,
      confidence: body?.confidence ?? interviewRequest.result?.confidence,
      remarks: body?.remarks ?? interviewRequest.result?.remarks ?? "",
      feedback: body?.feedback ?? interviewRequest.result?.feedback ?? "",
    });

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "Published",
        publishedAt: new Date(),
        result: {
          ...interviewRequest.result,
          ...mergedPayload,
          status: "Published",
          publishedAt: new Date(),
        },
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "GET" && one === "student" && two && three === "interviews") {
    const requests = await WorkflowRequest.find({
      studentId: String(two),
      type: "interview",
    }).sort({ createdAt: -1 });
    return json(requests);
  }

  if (method === "POST" && one === "request" && two === "assessment") {
    const {
      studentId,
      studentName,
      studentEmail = "",
      assessmentId,
      title = "Assessment Request",
      scheduledDate,
    } = body;

    if (!studentId || !studentName || !assessmentId) {
      return json(
        {
          ok: false,
          message: "studentId, studentName and assessmentId are required",
        },
        400,
      );
    }

    const workflowRequest = await WorkflowRequest.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      type: "assessment",
      senderRole: "admin",
      receiverRole: "student",
      title,
      assessmentId: String(assessmentId),
      assessmentTitle: title,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: "Pending",
      requestDate: new Date(),
    });

    return json({ ok: true, request: workflowRequest }, 201);
  }

  if (method === "GET" && one === "requests" && !two) {
    const type = url.searchParams.get("type");
    const filter = {};
    if (type === "interview" || type === "assessment") {
      filter.type = type;
    }

    const requests = await WorkflowRequest.find(filter).sort({ createdAt: -1 });
    return json(requests);
  }

  if (method === "GET" && one === "student" && two && three === "requests") {
    const requests = await WorkflowRequest.find({
      studentId: String(two),
    }).sort({ createdAt: -1 });
    return json(requests);
  }

  if (method === "GET" && one === "student" && two && three === "assessments") {
    const requests = await WorkflowRequest.find({
      studentId: String(two),
      type: "assessment",
    }).sort({ createdAt: -1 });
    const payload = await Promise.all(
      requests.map((item) => serializeStudentAssessmentRequest(item)),
    );
    return json(payload.filter(Boolean));
  }

  if (method === "PUT" && one === "request" && two && three === "status") {
    const { status } = body;
    if (!WORKFLOW_STATUSES.includes(status)) {
      return json({ ok: false, message: "Invalid status" }, 400);
    }

    const workflowRequest = await WorkflowRequest.findByIdAndUpdate(
      two,
      { status },
      { new: true },
    );
    if (!workflowRequest) {
      return json({ ok: false, message: "Request not found" }, 404);
    }

    return json({ ok: true, request: workflowRequest });
  }

  if (method === "POST" && one === "assessment" && two === "create") {
    const {
      title,
      description = "",
      totalMarks = 100,
      questions = [],
      assignedStudentIds = [],
    } = body;

    if (!title) {
      return json({ ok: false, message: "Assessment title is required" }, 400);
    }

    const assessment = await Assessment.create({
      title,
      description,
      totalMarks: Number(totalMarks) || 100,
      assignedStudentIds: Array.isArray(assignedStudentIds)
        ? assignedStudentIds.map((id) => String(id))
        : [],
      questions,
      status: "active",
    });

    return json({ ok: true, assessment }, 201);
  }

  if (method === "POST" && one === "assessment" && two === "request") {
    const {
      studentId,
      studentName,
      studentEmail = "",
      assessmentId,
      assessmentTitle = "",
      title = "",
      scheduledDate = null,
    } = body;

    if (!studentId || !studentName || !assessmentId) {
      return json(
        {
          ok: false,
          message: "studentId, studentName and assessmentId are required",
        },
        400,
      );
    }

    const assessment = await loadAssessmentDetails(assessmentId);
    if (!assessment) {
      return json({ ok: false, message: "Assessment not found" }, 404);
    }

    const workflowRequest = await WorkflowRequest.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      type: "assessment",
      senderRole: "admin",
      receiverRole: "student",
      title: title || assessmentTitle || assessment.title,
      assessmentId: String(assessment._id),
      assessmentTitle: title || assessmentTitle || assessment.title,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: "Pending",
      requestDate: new Date(),
    });

    return json({ ok: true, request: workflowRequest }, 201);
  }

  if (method === "PUT" && one === "assessment" && two && three === "accept") {
    const workflowRequest = await loadAssessmentRequest(two);
    if (!workflowRequest || workflowRequest.type !== "assessment") {
      return json({ ok: false, message: "Assessment request not found" }, 404);
    }

    if (workflowRequest.status !== "Pending") {
      return json(
        {
          ok: false,
          message: "Only Pending assessment requests can be accepted",
        },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      { status: "Accepted", acceptedAt: new Date() },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "PUT" && one === "assessment" && two && three === "submit") {
    const { answers = [] } = body;
    const workflowRequest = await loadAssessmentRequest(two);
    if (!workflowRequest || workflowRequest.type !== "assessment") {
      return json({ ok: false, message: "Assessment request not found" }, 404);
    }

    if (
      workflowRequest.status !== "In Progress" &&
      workflowRequest.status !== "Submitted"
    ) {
      return json(
        {
          ok: false,
          message: "Assessment must be In Progress before submission",
        },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "Submitted",
        answers: Array.isArray(answers) ? answers : [],
        submittedAt: new Date(),
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "PUT" && one === "assessment" && two && three === "start") {
    const workflowRequest = await loadAssessmentRequest(two);
    if (!workflowRequest || workflowRequest.type !== "assessment") {
      return json({ ok: false, message: "Assessment request not found" }, 404);
    }

    if (
      workflowRequest.status !== "Accepted" &&
      workflowRequest.status !== "In Progress"
    ) {
      return json(
        { ok: false, message: "Only Accepted assessments can be started" },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "In Progress",
        startedAt: workflowRequest.startedAt || new Date(),
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (
    method === "POST" &&
    one === "assessment" &&
    two &&
    three === "evaluate"
  ) {
    const {
      evaluation = [],
      score = 0,
      percentage = null,
      resultStatus = "",
      feedback = "",
    } = body;
    const workflowRequest = await loadAssessmentRequest(two);
    if (!workflowRequest || workflowRequest.type !== "assessment") {
      return json({ ok: false, message: "Assessment request not found" }, 404);
    }

    if (
      workflowRequest.status !== "Submitted" &&
      workflowRequest.status !== "Evaluated"
    ) {
      return json(
        { ok: false, message: "Only Submitted assessments can be evaluated" },
        409,
      );
    }

    const summary = buildEvaluationSummary(evaluation, score);
    const nextScore = Number(score ?? summary.score ?? 0);
    const nextPercentage =
      percentage === null || percentage === undefined || percentage === ""
        ? Number(summary.percentage || 0)
        : Number(percentage);
    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "Evaluated",
        evaluation: Array.isArray(evaluation) ? evaluation : [],
        score: nextScore,
        percentage: nextPercentage,
        resultStatus: resultStatus || (nextPercentage >= 40 ? "Pass" : "Fail"),
        feedback,
        evaluatedAt: new Date(),
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (
    (method === "PUT" || method === "POST") &&
    one === "assessment" &&
    two &&
    three === "publish"
  ) {
    const {
      score = 0,
      percentage = 0,
      resultStatus = "",
      feedback = "",
    } = body;
    const workflowRequest = await loadAssessmentRequest(two);
    if (!workflowRequest || workflowRequest.type !== "assessment") {
      return json({ ok: false, message: "Assessment request not found" }, 404);
    }

    if (
      workflowRequest.status !== "Evaluated" &&
      workflowRequest.status !== "Published"
    ) {
      return json(
        { ok: false, message: "Only Evaluated assessments can be published" },
        409,
      );
    }

    const updated = await WorkflowRequest.findByIdAndUpdate(
      two,
      {
        status: "Published",
        score: Number(score || workflowRequest.score || 0),
        percentage: Number(percentage || workflowRequest.percentage || 0),
        resultStatus:
          resultStatus ||
          workflowRequest.resultStatus ||
          (Number(percentage || workflowRequest.percentage || 0) >= 40
            ? "Pass"
            : "Fail"),
        feedback,
        publishedAt: new Date(),
      },
      { new: true },
    );

    return json({ ok: true, request: updated });
  }

  if (method === "POST" && one === "interview" && two === "result") {
    const {
      requestId,
      technicalScore = 0,
      communication = 0,
      confidence = 0,
      remarks = "",
      feedback = "",
    } = body;

    if (!requestId) {
      return json({ ok: false, message: "requestId is required" }, 400);
    }

    const resultPayload = buildInterviewResultPayload({
      technicalScore,
      communication,
      confidence,
      remarks,
      feedback,
    });

    const workflowRequest = await WorkflowRequest.findByIdAndUpdate(
      requestId,
      {
        status: "Completed",
        completedAt: new Date(),
        result: {
          ...resultPayload,
          status: "Completed",
        },
      },
      { new: true },
    );

    if (!workflowRequest) {
      return json({ ok: false, message: "Request not found" }, 404);
    }

    return json({ ok: true, request: workflowRequest });
  }

  if (method === "POST" && one === "assessment" && two === "result") {
    const {
      requestId,
      score = 0,
      percentage = 0,
      status = "Pass",
      feedback = "",
    } = body;

    if (!requestId) {
      return json({ ok: false, message: "requestId is required" }, 400);
    }

    const safeScore = Math.max(0, Number(score || 0));
    const safePercentage = Math.max(0, Math.min(100, Number(percentage || 0)));
    const normalizedStatus = String(status || "Pass");

    const workflowRequest = await WorkflowRequest.findByIdAndUpdate(
      requestId,
      {
        status: "Published",
        result: {
          score: safeScore,
          percentage: safePercentage,
          feedback,
          status: normalizedStatus,
          publishedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!workflowRequest) {
      return json({ ok: false, message: "Request not found" }, 404);
    }

    return json({ ok: true, request: workflowRequest });
  }

  if (method === "POST" && one === "interview-request" && !two) {
    const {
      studentId,
      studentName,
      studentEmail,
      contactNumber = "",
      preferredDate = "",
      preferredTime = "",
      interviewType = "Technical",
      mode = "online",
      topic = "",
      message = "",
    } = body;

    if (!studentId || !studentName || !studentEmail) {
      return json({ ok: false, message: "Student details are required" }, 400);
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
      status: "new",
    });

    return json({ ok: true, request: requestDoc }, 201);
  }

  if (method === "GET" && one === "interview-requests" && !two) {
    const requests = await InterviewRequest.find().sort({ createdAt: -1 });
    return json(requests);
  }

  if (
    method === "PUT" &&
    one === "interview-request" &&
    two &&
    three === "status"
  ) {
    const { status } = body;
    const allowed = ["new", "reviewed", "scheduled"];
    if (!allowed.includes(status)) {
      return json({ ok: false, message: "Invalid status" }, 400);
    }

    const updated = await InterviewRequest.findByIdAndUpdate(
      two,
      { status },
      { new: true },
    );
    if (!updated) {
      return json({ ok: false, message: "Interview request not found" }, 404);
    }

    return json({ ok: true, request: updated });
  }

  if (method === "POST" && one === "interview-feedback") {
    const {
      interviewId,
      communication,
      technicalSkills,
      confidence,
      remarks = "",
    } = body;

    if (!interviewId) {
      return json({ ok: false, message: "interviewId is required" }, 400);
    }

    const safeCommunication = Math.max(
      0,
      Math.min(10, Number(communication || 0)),
    );
    const safeTechnical = Math.max(
      0,
      Math.min(10, Number(technicalSkills || 0)),
    );
    const safeConfidence = Math.max(0, Math.min(10, Number(confidence || 0)));
    const overallScore = Math.round(
      ((safeCommunication + safeTechnical + safeConfidence) / 30) * 100,
    );

    const updated = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: "Completed",
        feedback: {
          communication: safeCommunication,
          technicalSkills: safeTechnical,
          confidence: safeConfidence,
          overallScore,
          remarks,
        },
      },
      { new: true },
    );

    if (!updated) {
      return json({ ok: false, message: "Interview not found" }, 404);
    }

    return json({ ok: true, interview: updated });
  }

  if (method === "POST" && one === "assessments" && !two) {
    const {
      title,
      description = "",
      totalMarks = 100,
      assignedStudentIds = [],
      questions = [],
    } = body;

    if (!title) {
      return json({ ok: false, message: "Assessment title is required" }, 400);
    }

    const assessment = await Assessment.create({
      title,
      description,
      totalMarks: Number(totalMarks) || 100,
      assignedStudentIds: assignedStudentIds.map((id) => String(id)),
      questions,
      status: "active",
    });

    return json({ ok: true, assessment }, 201);
  }

  if (method === "GET" && one === "assessments" && !two) {
    const studentId = url.searchParams.get("studentId");

    let assessments;
    if (studentId) {
      assessments = await Assessment.find({
        $or: [
          { assignedStudentIds: { $size: 0 } },
          { assignedStudentIds: String(studentId) },
        ],
      }).sort({ createdAt: -1 });
    } else {
      assessments = await Assessment.find().sort({ createdAt: -1 });
    }

    return json(assessments);
  }

  if (method === "GET" && one === "assessments" && two) {
    const assessment = await Assessment.findById(two);
    if (!assessment) {
      return json({ ok: false, message: "Assessment not found" }, 404);
    }

    return json(assessment);
  }

  if (method === "DELETE" && one === "assessments" && two) {
    const removed = await Assessment.findByIdAndDelete(two);
    if (!removed) {
      return json({ ok: false, message: "Assessment not found" }, 404);
    }

    await AssessmentSubmission.deleteMany({ assessmentId: String(two) });
    return json({ ok: true });
  }

  if (method === "POST" && one === "assessment" && two === "submit") {
    const {
      assessmentId,
      studentId,
      studentName,
      answers = [],
      requestId = "",
      status: nextStatus = "Submitted",
    } = body;

    if (!assessmentId || !studentId || !studentName) {
      return json(
        {
          ok: false,
          message: "assessmentId, studentId and studentName are required",
        },
        400,
      );
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return json({ ok: false, message: "Assessment not found" }, 404);
    }

    const totalQuestions = assessment.questions.length || 1;
    let correctCount = 0;

    assessment.questions.forEach((question, index) => {
      if ((answers[index] || "") === (question.correctAnswer || "")) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const score = Math.round(
      (percentage / 100) * (Number(assessment.totalMarks) || 100),
    );
    const resultStatus = percentage >= 40 ? "Passed" : "Failed";

    const submission = await AssessmentSubmission.create({
      assessmentId: String(assessment._id),
      studentId: String(studentId),
      studentName,
      score,
      percentage,
      status: resultStatus,
      answers,
    });

    if (requestId) {
      await WorkflowRequest.findByIdAndUpdate(requestId, {
        status: nextStatus === "In Progress" ? "In Progress" : "Submitted",
        answers,
        score,
        percentage,
      });
    }

    return json({ ok: true, submission }, 201);
  }

  if (method === "GET" && one === "assessment" && two === "results" && three) {
    const results = await AssessmentSubmission.find({
      studentId: String(three),
    }).sort({ createdAt: -1 });
    return json(results);
  }

  if (
    method === "GET" &&
    one === "student" &&
    two &&
    three === "full-performance"
  ) {
    const db = await initDb();
    const studentId = String(two);
    const numericStudentId = Number(studentId);

    const student = await db.get(
      "SELECT * FROM students WHERE id = ?",
      numericStudentId,
    );
    if (!student) {
      return json({ ok: false, message: "Student not found" }, 404);
    }

    const assessments = await AssessmentSubmission.find({ studentId }).sort({
      createdAt: -1,
    });
    const interviews = await Interview.find({ studentId }).sort({
      interviewDateTime: -1,
    });

    const latestAssessment = assessments[0];
    const latestInterview = interviews[0];

    const attendance = Number(student.attendance || 0);
    const marks = Number(student.marks || 0);
    const assignments = Number(student.marks || 0);
    const assessmentScore = Number(latestAssessment?.percentage || 0);
    const interviewScore = Number(latestInterview?.feedback?.overallScore || 0);

    const overallScore =
      attendance * 0.2 +
      marks * 0.3 +
      assessmentScore * 0.2 +
      interviewScore * 0.2 +
      assignments * 0.1;

    const normalizedOverallScore = Math.round(
      Math.max(0, Math.min(100, overallScore)),
    );
    const riskLevel =
      normalizedOverallScore < 60
        ? "High"
        : normalizedOverallScore < 80
          ? "Medium"
          : "Low";

    return json({
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
    });
  }

  if (method === "POST" && one === "interviews" && !two) {
    const {
      studentId,
      studentName,
      studentEmail,
      interviewDateTime,
      interviewType,
      meetingLink,
      notes = "",
    } = body;

    if (
      !studentId ||
      !studentName ||
      !studentEmail ||
      !interviewDateTime ||
      !interviewType ||
      !meetingLink
    ) {
      return json(
        {
          ok: false,
          message: "All required interview fields must be provided",
        },
        400,
      );
    }

    const interview = await Interview.create({
      studentId: String(studentId),
      studentName,
      studentEmail,
      interviewDateTime: new Date(interviewDateTime),
      interviewType,
      meetingLink,
      notes,
      status: "Scheduled",
    });

    let emailSent = false;
    try {
      await sendMockInterviewInvite({
        studentName,
        studentEmail,
        interviewDateTime,
        interviewType,
        meetingLink,
      });

      emailSent = true;
      interview.emailSent = true;
      await interview.save();
    } catch {
      emailSent = false;
    }

    return json({ ok: true, interview, emailSent }, 201);
  }

  if (method === "GET" && one === "interviews" && !two) {
    const interviews = await Interview.find().sort({ interviewDateTime: 1 });
    return json(interviews);
  }

  if (method === "GET" && one === "interviews" && two) {
    const interviews = await Interview.find({ studentId: String(two) }).sort({
      interviewDateTime: 1,
    });
    return json(interviews);
  }

  if (method === "PUT" && one === "interviews" && two) {
    const payload = { ...body };
    if (payload.interviewDateTime) {
      payload.interviewDateTime = new Date(payload.interviewDateTime);
    }

    const updated = await Interview.findByIdAndUpdate(two, payload, {
      new: true,
    });
    if (!updated) {
      return json({ ok: false, message: "Interview not found" }, 404);
    }

    return json({ ok: true, interview: updated });
  }

  if (method === "DELETE" && one === "interviews" && two) {
    const removed = await Interview.findByIdAndDelete(two);
    if (!removed) {
      return json({ ok: false, message: "Interview not found" }, 404);
    }

    return json({ ok: true });
  }

  return json({ ok: false, message: "Route not found" }, 404);
}

async function withHandler(method, request, context) {
  try {
    const resolvedParams = context?.params ? await context.params : {};
    return await handleRequest(method, request, resolvedParams);
  } catch (error) {
    return json(
      {
        ok: false,
        message: error?.message || "Unexpected API error",
      },
      500,
    );
  }
}

export async function GET(request, context) {
  return withHandler("GET", request, context);
}

export async function POST(request, context) {
  return withHandler("POST", request, context);
}

export async function PUT(request, context) {
  return withHandler("PUT", request, context);
}

export async function DELETE(request, context) {
  return withHandler("DELETE", request, context);
}
