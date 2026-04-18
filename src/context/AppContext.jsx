import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const AUTH_KEY = 'sps_auth_user'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const USERS_COLLECTION = 'users'
const STUDENTS_COLLECTION = 'students'
const MOCK_INTERVIEW_COLLECTION = 'mockInterviewRequests'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

function normalizeStudentName(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
}

function computePredictedScore(attendance, marks, interactionScore) {
  const safeAttendance = Number(attendance) || 0
  const safeMarks = Number(marks) || 0
  const safeInteraction = Number(interactionScore) || 0

  const weightedScore = Math.round(safeAttendance * 0.35 + safeMarks * 0.45 + safeInteraction * 0.2)
  return Math.max(0, Math.min(100, weightedScore))
}

function computeRiskLevel(predictedScore) {
  if (predictedScore < 60) {
    return 'High'
  }

  if (predictedScore < 80) {
    return 'Medium'
  }

  return 'Low'
}

function parseFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [users, setUsers] = useState([])
  const [students, setStudents] = useState([])
  const [interviews, setInterviews] = useState([])
  const [interviewRequests, setInterviewRequests] = useState([])
  const [assessments, setAssessments] = useState([])
  const [assessmentResults, setAssessmentResults] = useState([])
  const [workflowRequests, setWorkflowRequests] = useState([])
  const [mockInterviewRequests, setMockInterviewRequests] = useState([])
  const [currentUser, setCurrentUser] = useState(() => parseFromStorage(AUTH_KEY, null))

  const interviewApiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    const isJson = response.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await response.json() : null

    if (!response.ok) {
      throw new Error(data?.message || 'Interview API request failed')
    }

    return data
  }

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION))
    const loadedUsers = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }))

    setUsers(loadedUsers)
    return loadedUsers
  }

  const loadStudents = async () => {
    const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION))
    const loadedStudents = snapshot.docs
      .map((document) => ({
        id: document.data().id ?? document.id,
        docId: document.id,
        ...document.data(),
      }))
      .sort((a, b) => Number(a.id) - Number(b.id))

    setStudents(loadedStudents)
    return loadedStudents
  }

  const loadMockInterviewRequests = async () => {
    const snapshot = await getDocs(collection(db, MOCK_INTERVIEW_COLLECTION))
    const loadedRequests = snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }))
      .sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0)))

    setMockInterviewRequests(loadedRequests)
    return loadedRequests
  }

  const loadInterviews = async () => {
    try {
      const loadedInterviews = await interviewApiRequest('/interviews')
      setInterviews(Array.isArray(loadedInterviews) ? loadedInterviews : [])
      return loadedInterviews
    } catch {
      setInterviews([])
      return []
    }
  }

  const loadInterviewRequests = async () => {
    try {
      const loadedRequests = await interviewApiRequest('/interview-requests')
      const normalized = Array.isArray(loadedRequests) ? loadedRequests : []
      setInterviewRequests(normalized)
      setMockInterviewRequests(normalized)
      return normalized
    } catch {
      setInterviewRequests([])
      setMockInterviewRequests([])
      return []
    }
  }

  const loadWorkflowRequests = async (type) => {
    try {
      const query = type ? `?type=${encodeURIComponent(type)}` : ''
      const loadedRequests = await interviewApiRequest(`/requests${query}`)
      const normalized = Array.isArray(loadedRequests) ? loadedRequests : []
      setWorkflowRequests(normalized)
      return normalized
    } catch {
      setWorkflowRequests([])
      return []
    }
  }

  const loadStudentWorkflowRequests = async (studentId) => {
    try {
      if (!studentId) {
        setWorkflowRequests([])
        return []
      }

      const loadedRequests = await interviewApiRequest(`/student/${studentId}/requests`)
      const normalized = Array.isArray(loadedRequests) ? loadedRequests : []
      setWorkflowRequests(normalized)
      return normalized
    } catch {
      setWorkflowRequests([])
      return []
    }
  }

  const loadAssessments = async (studentId) => {
    try {
      const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''
      const loadedAssessments = await interviewApiRequest(`/assessments${query}`)
      const normalized = Array.isArray(loadedAssessments) ? loadedAssessments : []
      setAssessments(normalized)
      return normalized
    } catch {
      setAssessments([])
      return []
    }
  }

  const loadAssessmentResults = async (studentId) => {
    try {
      if (!studentId) {
        setAssessmentResults([])
        return []
      }

      const loadedResults = await interviewApiRequest(`/assessment/results/${studentId}`)
      const normalized = Array.isArray(loadedResults) ? loadedResults : []
      setAssessmentResults(normalized)
      return normalized
    } catch {
      setAssessmentResults([])
      return []
    }
  }

  const getAssessmentById = async (assessmentId) => {
    return interviewApiRequest(`/assessments/${assessmentId}`)
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadUsers(),
          loadStudents(),
          loadMockInterviewRequests(),
          loadInterviews(),
          loadInterviewRequests(),
          loadWorkflowRequests(),
          loadAssessments(),
        ])
      } catch {
        setUsers([])
        setStudents([])
        setMockInterviewRequests([])
        setInterviews([])
        setInterviewRequests([])
        setWorkflowRequests([])
        setAssessments([])
        setAssessmentResults([])
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }, [currentUser])

  const registerUser = async ({ username, email, password }) => {
    const normalizedUsername = username.trim().toLowerCase()

    try {
      if (!normalizedUsername || !email.trim() || !password) {
        return { ok: false, message: 'All fields are required' }
      }

      if (normalizedUsername === ADMIN_USERNAME) {
        return { ok: false, message: 'Username is reserved' }
      }

      const existingUserQuery = query(collection(db, USERS_COLLECTION), where('username', '==', normalizedUsername))
      const existingUserSnapshot = await getDocs(existingUserQuery)

      if (!existingUserSnapshot.empty) {
        return { ok: false, message: 'Username already exists' }
      }

      await addDoc(collection(db, USERS_COLLECTION), {
        username: normalizedUsername,
        email: email.trim(),
        password,
        role: 'student',
        userId: `USR-${Date.now()}`,
      })

      await loadUsers()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Registration failed' }
    }
  }

  const loginUser = async ({ username, password, loginType = 'student' }) => {
    try {
      if (loginType === 'admin') {
        if (!(username === ADMIN_USERNAME && password === ADMIN_PASSWORD)) {
          return { ok: false, message: 'Invalid admin credentials' }
        }

        const authUser = { username: ADMIN_USERNAME, role: 'admin', userId: 'ADMIN-001' }
        setCurrentUser(authUser)

        return {
          ok: true,
          user: authUser,
          redirectTo: '/dashboard',
        }
      }

      const normalizedUsername = username.trim().toLowerCase()
      const existingUserQuery = query(collection(db, USERS_COLLECTION), where('username', '==', normalizedUsername))
      const existingUserSnapshot = await getDocs(existingUserQuery)

      if (existingUserSnapshot.empty) {
        return { ok: false, message: 'Student account not found' }
      }

      const userRecord = { id: existingUserSnapshot.docs[0].id, ...existingUserSnapshot.docs[0].data() }
      if (userRecord.password !== password) {
        return { ok: false, message: 'Invalid student credentials' }
      }

      const authUser = {
        username: userRecord.username,
        role: userRecord.role || 'student',
        userId: userRecord.userId || `USR-${Date.now()}`,
      }

      setCurrentUser(authUser)

      return {
        ok: true,
        user: authUser,
        redirectTo: '/student-dashboard',
      }
    } catch (error) {
      return { ok: false, message: error.message || 'Login failed' }
    }
  }

  const logoutUser = () => {
    localStorage.removeItem(AUTH_KEY)
    setCurrentUser(null)
  }

  const addStudent = async ({ name, birthYear, attendance, marks, interactionScore }) => {
    try {
      const normalizedName = name.trim()
      const normalizedUsername = normalizeStudentName(normalizedName)

      if (!normalizedName || !birthYear || !normalizedUsername) {
        return { ok: false, message: 'Name and birth year are required' }
      }

      const existingUserQuery = query(collection(db, USERS_COLLECTION), where('username', '==', normalizedUsername))
      const existingUserSnapshot = await getDocs(existingUserQuery)

      if (!existingUserSnapshot.empty || normalizedUsername === ADMIN_USERNAME) {
        return { ok: false, message: 'Username already exists for this student name' }
      }

      const nextId = students.length ? Math.max(...students.map((student) => Number(student.id) || 0)) + 1 : 1
      const generatedPassword = `${normalizedUsername}${String(birthYear).trim()}`
      const predictedScore = computePredictedScore(attendance, marks, interactionScore)
      const riskLevel = computeRiskLevel(predictedScore)

      await addDoc(collection(db, STUDENTS_COLLECTION), {
        id: nextId,
        name: normalizedName,
        username: normalizedUsername,
        birthYear: Number(birthYear),
        attendance: Number(attendance),
        marks: Number(marks),
        interactionScore: Number(interactionScore),
        predictedScore,
        riskLevel,
      })

      await addDoc(collection(db, USERS_COLLECTION), {
        username: normalizedUsername,
        email: `${normalizedUsername}@student.local`,
        password: generatedPassword,
        role: 'student',
        userId: `STD-${nextId}`,
      })

      await Promise.all([loadUsers(), loadStudents()])

      return { ok: true, username: normalizedUsername, password: generatedPassword }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to add student' }
    }
  }

  const updateStudent = async (id, payload) => {
    const matchedStudent = students.find((student) => String(student.id) === String(id))
    if (!matchedStudent?.docId) {
      return
    }

    const attendance = Number(payload.attendance)
    const marks = Number(payload.marks)
    const interactionScore = Number(payload.interactionScore)
    const predictedScore = computePredictedScore(attendance, marks, interactionScore)
    const riskLevel = computeRiskLevel(predictedScore)

    await updateDoc(doc(db, STUDENTS_COLLECTION, matchedStudent.docId), {
      name: payload.name,
      birthYear: Number(payload.birthYear),
      attendance,
      marks,
      interactionScore,
      predictedScore,
      riskLevel,
    })

    await loadStudents()
  }

  const deleteStudent = async (id) => {
    const matchedStudent = students.find((student) => String(student.id) === String(id))
    if (!matchedStudent) {
      return
    }

    if (matchedStudent.docId) {
      await deleteDoc(doc(db, STUDENTS_COLLECTION, matchedStudent.docId))
    }

    const matchingUsers = await getDocs(query(collection(db, USERS_COLLECTION), where('username', '==', matchedStudent.username)))
    await Promise.all(matchingUsers.docs.map((userDocument) => deleteDoc(doc(db, USERS_COLLECTION, userDocument.id))))

    await Promise.all([loadUsers(), loadStudents()])
  }

  const currentStudent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null
    }

    return students.find((student) => student.username === currentUser.username) ?? null
  }, [currentUser, students])

  const currentUserAccount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null
    }

    return users.find((user) => user.username === currentUser.username) ?? null
  }, [currentUser, users])

  const updateUserProfile = async ({ email, password }) => {
    if (!currentUser || currentUser.role !== 'student') {
      return { ok: false, message: 'Only student profiles can be updated here' }
    }

    const account = users.find((user) => user.username === currentUser.username)
    if (!account?.id) {
      return { ok: false, message: 'Account not found' }
    }

    const updatePayload = {}
    if (typeof email === 'string' && email.trim()) {
      updatePayload.email = email.trim()
    }

    if (typeof password === 'string' && password.trim()) {
      updatePayload.password = password.trim()
    }

    if (!Object.keys(updatePayload).length) {
      return { ok: false, message: 'No changes provided' }
    }

    try {
      await updateDoc(doc(db, USERS_COLLECTION, account.id), updatePayload)
      await loadUsers()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update profile' }
    }
  }

  const submitMockInterviewRequest = async (payload) => {
    try {
      if (!currentUser || currentUser.role !== 'student') {
        return { ok: false, message: 'Only students can submit requests' }
      }

      await interviewApiRequest('/interview-request', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          studentId: String(currentStudent?.id ?? ''),
          studentName: payload.fullName || currentStudent?.name || currentUser.username,
          studentEmail: currentUserAccount?.email || `${currentUser.username}@student.local`,
        }),
      })

      await loadInterviewRequests()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit request' }
    }
  }

  const updateMockInterviewRequestStatus = async (requestId, status) => {
    try {
      await interviewApiRequest(`/interview-request/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      await loadInterviewRequests()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update request status' }
    }
  }

  const createInterview = async (payload) => {
    try {
      const result = await interviewApiRequest('/interviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await loadInterviews()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create interview' }
    }
  }

  const sendInterviewRequest = async (payload) => {
    try {
      const result = await interviewApiRequest('/request/interview', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (currentUser?.role === 'admin') {
        await loadWorkflowRequests('interview')
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send interview request' }
    }
  }

  const sendAssessmentRequest = async (payload) => {
    try {
      const result = await interviewApiRequest('/request/assessment', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (currentUser?.role === 'admin') {
        await loadWorkflowRequests('assessment')
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send assessment request' }
    }
  }

  const updateWorkflowRequestStatus = async (requestId, status) => {
    try {
      const result = await interviewApiRequest(`/request/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests()
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update request status' }
    }
  }

  const publishInterviewResult = async (payload) => {
    try {
      const result = await interviewApiRequest('/interview/result', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests('interview')
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish interview result' }
    }
  }

  const publishAssessmentResult = async (payload) => {
    try {
      const result = await interviewApiRequest('/assessment/result', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests('assessment')
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish assessment result' }
    }
  }

  const updateInterview = async (id, payload) => {
    try {
      const result = await interviewApiRequest(`/interviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      await loadInterviews()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update interview' }
    }
  }

  const addInterviewFeedback = async ({ interviewId, communication, technicalSkills, confidence, remarks }) => {
    try {
      const result = await interviewApiRequest('/interview-feedback', {
        method: 'POST',
        body: JSON.stringify({ interviewId, communication, technicalSkills, confidence, remarks }),
      })

      await loadInterviews()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to add interview feedback' }
    }
  }

  const createAssessment = async (payload) => {
    try {
      const result = await interviewApiRequest('/assessments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await loadAssessments()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create assessment' }
    }
  }

  const deleteAssessment = async (assessmentId) => {
    try {
      await interviewApiRequest(`/assessments/${assessmentId}`, {
        method: 'DELETE',
      })

      await loadAssessments()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to delete assessment' }
    }
  }

  const submitAssessment = async ({ assessmentId, studentId, studentName, answers }) => {
    try {
      const result = await interviewApiRequest('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ assessmentId, studentId, studentName, answers, requestId: '' }),
      })

      await loadAssessmentResults(studentId)
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment' }
    }
  }

  const submitAssessmentRequestResponse = async ({ assessmentId, studentId, studentName, answers, requestId }) => {
    try {
      const result = await interviewApiRequest('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ assessmentId, studentId, studentName, answers, requestId }),
      })

      await loadAssessmentResults(studentId)
      if (currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment' }
    }
  }

  const getStudentFullPerformance = async (studentId) => {
    try {
      const result = await interviewApiRequest(`/student/${studentId}/full-performance`)
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to fetch full performance' }
    }
  }

  const deleteInterview = async (id) => {
    try {
      await interviewApiRequest(`/interviews/${id}`, {
        method: 'DELETE',
      })

      await loadInterviews()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to delete interview' }
    }
  }

  const studentInterviews = useMemo(() => {
    if (!currentStudent) {
      return []
    }

    return interviews
      .filter((item) => String(item.studentId) === String(currentStudent.id))
      .sort((a, b) => Number(new Date(a.interviewDateTime)) - Number(new Date(b.interviewDateTime)))
  }, [interviews, currentStudent])

  const latestAssessmentResult = useMemo(() => {
    return assessmentResults[0] ?? null
  }, [assessmentResults])

  const latestInterviewResult = useMemo(() => {
    return studentInterviews.find((item) => Number(item?.feedback?.overallScore || 0) > 0) ?? studentInterviews[0] ?? null
  }, [studentInterviews])

  useEffect(() => {
    if (currentStudent?.id) {
      loadAssessmentResults(String(currentStudent.id))
      loadAssessments(String(currentStudent.id))
      loadStudentWorkflowRequests(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  const studentWorkflowRequests = useMemo(() => {
    if (!currentStudent?.id) {
      return []
    }

    return workflowRequests.filter((request) => String(request.studentId) === String(currentStudent.id))
  }, [workflowRequests, currentStudent?.id])

  const studentInterviewRequests = useMemo(() => {
    return studentWorkflowRequests.filter((request) => request.type === 'interview')
  }, [studentWorkflowRequests])

  const studentAssessmentRequests = useMemo(() => {
    return studentWorkflowRequests.filter((request) => request.type === 'assessment')
  }, [studentWorkflowRequests])

  const value = {
    users,
    students,
    interviews,
    studentInterviews,
    workflowRequests,
    studentWorkflowRequests,
    studentInterviewRequests,
    studentAssessmentRequests,
    interviewRequests,
    assessments,
    assessmentResults,
    latestAssessmentResult,
    latestInterviewResult,
    mockInterviewRequests,
    currentUser,
    currentStudent,
    currentUserAccount,
    registerUser,
    loginUser,
    logoutUser,
    addStudent,
    updateStudent,
    deleteStudent,
    updateUserProfile,
    submitMockInterviewRequest,
    updateMockInterviewRequestStatus,
    addInterviewFeedback,
    createAssessment,
    deleteAssessment,
    submitAssessment,
    submitAssessmentRequestResponse,
    sendInterviewRequest,
    sendAssessmentRequest,
    updateWorkflowRequestStatus,
    publishInterviewResult,
    publishAssessmentResult,
    getAssessmentById,
    getStudentFullPerformance,
    loadInterviewRequests,
    loadWorkflowRequests,
    loadStudentWorkflowRequests,
    loadAssessments,
    loadAssessmentResults,
    loadInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
