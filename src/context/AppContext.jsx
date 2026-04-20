import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const AUTH_KEY = 'sps_auth_user'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const USERS_COLLECTION = 'users'
const STUDENTS_COLLECTION = 'students'
const MOCK_INTERVIEW_COLLECTION = 'mockInterviewRequests'
const INTERVIEWS_COLLECTION = 'interviews'
const WORKFLOW_REQUESTS_COLLECTION = 'workflowRequests'
const ASSESSMENTS_COLLECTION = 'assessments'
const ASSESSMENT_RESULTS_COLLECTION = 'assessmentResults'
const STUDENT_ASSESSMENTS_COLLECTION = 'studentAssessments'
const INTERVIEW_RESULTS_COLLECTION = 'interviewResults'
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
  const [studentAssessments, setStudentAssessments] = useState([])
  const [mockInterviewRequests, setMockInterviewRequests] = useState([])
  const [currentUser, setCurrentUser] = useState(() => parseFromStorage(AUTH_KEY, null))

  const interviewApiRequest = async (path, options = {}) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const baseCandidates = Array.from(
      new Set([
        API_BASE_URL,
        '/api',
      ].filter(Boolean)),
    )

    let lastError = null

    for (const base of baseCandidates) {
      try {
        const response = await fetch(`${String(base).replace(/\/$/, '')}${normalizedPath}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          ...options,
        })

        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const data = isJson ? await response.json() : null

        if (!response.ok) {
          let message = data?.message

          if (!message) {
            const text = isJson ? '' : await response.text().catch(() => '')
            message = text?.trim() || `Interview API request failed (${response.status})`
          }

          const httpError = new Error(message)
          httpError.__noRetry = true
          throw httpError
        }

        return data
      } catch (error) {
        if (error?.__noRetry) {
          throw error
        }

        lastError = error
      }
    }

    throw new Error(lastError?.message || 'Interview API request failed')
  }

  const getEntityDocId = (item) => {
    if (!item || typeof item !== 'object') {
      return ''
    }

    return String(item._id || item.id || item.requestId || '')
  }

  const syncEntityToFirestore = async (collectionName, item) => {
    const docId = getEntityDocId(item)
    if (!docId) {
      return
    }

    await setDoc(
      doc(db, collectionName, docId),
      {
        ...item,
        syncedAt: new Date().toISOString(),
      },
      { merge: true },
    )
  }

  const syncListToFirestore = async (collectionName, items = []) => {
    if (!Array.isArray(items) || !items.length) {
      return
    }

    await Promise.all(items.map((item) => syncEntityToFirestore(collectionName, item)))
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
      const normalized = Array.isArray(loadedInterviews) ? loadedInterviews : []
      setInterviews(normalized)
      await syncListToFirestore(INTERVIEWS_COLLECTION, normalized)
      return normalized
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
      await syncListToFirestore(WORKFLOW_REQUESTS_COLLECTION, normalized)

      const interviewPublished = normalized.filter((item) => item.type === 'interview' && item.status === 'Published')
      if (interviewPublished.length) {
        await syncListToFirestore(INTERVIEW_RESULTS_COLLECTION, interviewPublished)
      }

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
      await syncListToFirestore(WORKFLOW_REQUESTS_COLLECTION, normalized)

      const interviewPublished = normalized.filter((item) => item.type === 'interview' && item.status === 'Published')
      if (interviewPublished.length) {
        await syncListToFirestore(INTERVIEW_RESULTS_COLLECTION, interviewPublished)
      }

      return normalized
    } catch {
      setWorkflowRequests([])
      return []
    }
  }

  const loadStudentInterviewRequests = async (studentId) => {
    try {
      if (!studentId) {
        return []
      }

      const loadedRequests = await interviewApiRequest(`/student/${studentId}/interviews`)
      const normalized = Array.isArray(loadedRequests) ? loadedRequests : []

      setWorkflowRequests((previous) => {
        const existing = Array.isArray(previous) ? previous : []
        const nonInterview = existing.filter((item) => !(item?.type === 'interview' && String(item?.studentId) === String(studentId)))
        return [...normalized, ...nonInterview].sort((a, b) => Number(new Date(b?.createdAt || 0)) - Number(new Date(a?.createdAt || 0)))
      })

      await syncListToFirestore(WORKFLOW_REQUESTS_COLLECTION, normalized)

      const interviewPublished = normalized.filter((item) => item.status === 'Published')
      if (interviewPublished.length) {
        await syncListToFirestore(INTERVIEW_RESULTS_COLLECTION, interviewPublished)
      }

      return normalized
    } catch {
      return []
    }
  }

  const loadStudentAssessments = async (studentId) => {
    try {
      if (!studentId) {
        setStudentAssessments([])
        return []
      }

      const loadedRequests = await interviewApiRequest(`/student/${studentId}/assessments`)
      const normalized = Array.isArray(loadedRequests) ? loadedRequests : []
      setStudentAssessments(normalized)
      await syncListToFirestore(STUDENT_ASSESSMENTS_COLLECTION, normalized)
      return normalized
    } catch {
      setStudentAssessments([])
      return []
    }
  }

  const loadAssessments = async (studentId) => {
    try {
      const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''
      const loadedAssessments = await interviewApiRequest(`/assessments${query}`)
      const normalized = Array.isArray(loadedAssessments) ? loadedAssessments : []
      setAssessments(normalized)
      await syncListToFirestore(ASSESSMENTS_COLLECTION, normalized)
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
      await syncListToFirestore(ASSESSMENT_RESULTS_COLLECTION, normalized)
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
        setStudentAssessments([])
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

  const addStudent = async ({
    name,
    birthYear,
    attendance,
    marks,
    interactionScore,
    address = '',
    age = '',
    bloodGroup = '',
    gender = '',
    mobileNumber = '',
    profilePhoto = '',
  }) => {
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
        address,
        age,
        bloodGroup,
        gender,
        mobileNumber,
        profilePhoto,
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
      address: payload.address ?? matchedStudent.address ?? '',
      age: payload.age ?? matchedStudent.age ?? '',
      bloodGroup: payload.bloodGroup ?? matchedStudent.bloodGroup ?? '',
      gender: payload.gender ?? matchedStudent.gender ?? '',
      mobileNumber: payload.mobileNumber ?? matchedStudent.mobileNumber ?? '',
      profilePhoto: payload.profilePhoto ?? matchedStudent.profilePhoto ?? '',
      predictedScore,
      riskLevel,
    })

    await loadStudents()
  }

  const updateCurrentStudentProfile = async (payload) => {
    if (!currentStudent?.docId) {
      return { ok: false, message: 'Student profile not found' }
    }

    try {
      await updateDoc(doc(db, STUDENTS_COLLECTION, currentStudent.docId), {
        name: payload.name ?? currentStudent.name,
        address: payload.address ?? currentStudent.address ?? '',
        age: payload.age ?? currentStudent.age ?? '',
        bloodGroup: payload.bloodGroup ?? currentStudent.bloodGroup ?? '',
        gender: payload.gender ?? currentStudent.gender ?? '',
        mobileNumber: payload.mobileNumber ?? currentStudent.mobileNumber ?? '',
        profilePhoto: payload.profilePhoto ?? currentStudent.profilePhoto ?? '',
      })

      await loadStudents()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update profile details' }
    }
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

      if (result?.interview) {
        await syncEntityToFirestore(INTERVIEWS_COLLECTION, result.interview)
      }

      await loadInterviews()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create interview' }
    }
  }

  const sendInterviewRequest = async (payload) => {
    try {
      let result

      try {
        result = await interviewApiRequest('/request/interview', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } catch {
        result = await interviewApiRequest('/interview/schedule', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('interview')

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send interview request' }
    }
  }

  const acceptInterviewRequest = async (requestId) => {
    try {
      const result = await interviewApiRequest(`/interview/${requestId}/accept`, {
        method: 'PUT',
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }
      await loadWorkflowRequests('interview')

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to accept interview request' }
    }
  }

  const completeInterviewRequest = async (requestId) => {
    try {
      const result = await interviewApiRequest(`/interview/${requestId}/complete`, {
        method: 'PUT',
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to complete interview request' }
    }
  }

  const saveInterviewResult = async ({ requestId, technicalScore = 0, communication = 0, confidence = 0, remarks = '', feedback = '' }) => {
    try {
      const result = await interviewApiRequest(`/interview/${requestId}/result`, {
        method: 'POST',
        body: JSON.stringify({ technicalScore, communication, confidence, remarks, feedback }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to save interview result' }
    }
  }

  const publishInterviewRequest = async ({ requestId, technicalScore = 0, communication = 0, confidence = 0, remarks = '', feedback = '' }) => {
    try {
      const result = await interviewApiRequest(`/interview/${requestId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ technicalScore, communication, confidence, remarks, feedback }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
        await syncEntityToFirestore(INTERVIEW_RESULTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish interview result' }
    }
  }

  const sendAssessmentRequest = async (payload) => {
    try {
      const result = await interviewApiRequest('/assessment/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      if (currentUser?.role === 'admin') {
        await loadWorkflowRequests('assessment')
        if (payload.studentId) {
          await loadStudentAssessments(String(payload.studentId))
        }
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send assessment request' }
    }
  }

  const requestAssessment = sendAssessmentRequest

  const acceptAssessmentRequest = async (requestId) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/accept`, {
        method: 'PUT',
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }
      await loadWorkflowRequests('assessment')

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to accept assessment request' }
    }
  }
  const startAssessmentRequest = async (requestId) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/start`, {
        method: 'PUT',
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }
      await loadWorkflowRequests('assessment')

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to start assessment' }
    }
  }

  const submitAssessmentAttempt = async ({ requestId, answers = [] }) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/submit`, {
        method: 'PUT',
        body: JSON.stringify({ answers }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }
      await loadWorkflowRequests('assessment')

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment attempt' }
    }
  }

  const evaluateAssessmentRequest = async ({ requestId, evaluation = [], score = 0, percentage = 0, resultStatus = '', feedback = '' }) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ evaluation, score, percentage, resultStatus, feedback }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to evaluate assessment request' }
    }
  }

  const publishAssessmentRequest = async ({ requestId, score = 0, percentage = 0, resultStatus = '', feedback = '' }) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ score, percentage, resultStatus, feedback }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
      }

      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish assessment result' }
    }
  }

  const updateWorkflowRequestStatus = async (requestId, status) => {
    try {
      const result = await interviewApiRequest(`/request/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

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
      const result = payload?.requestId
        ? await interviewApiRequest(`/interview/${payload.requestId}/publish`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await interviewApiRequest('/interview/result', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
        await syncEntityToFirestore(INTERVIEW_RESULTS_COLLECTION, result.request)
      }

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
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

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

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

      if (result?.interview) {
        await syncEntityToFirestore(INTERVIEWS_COLLECTION, result.interview)
      }

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

      if (result?.interview) {
        await syncEntityToFirestore(INTERVIEWS_COLLECTION, result.interview)
      }

      await loadInterviews()
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to add interview feedback' }
    }
  }

  const createAssessment = async (payload) => {
    try {
      const result = await interviewApiRequest('/assessment/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (result?.assessment) {
        await syncEntityToFirestore(ASSESSMENTS_COLLECTION, result.assessment)
      }

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
        body: JSON.stringify({ assessmentId, studentId, studentName, answers, requestId: '', status: 'Submitted' }),
      })

      if (result?.submission) {
        await syncEntityToFirestore(ASSESSMENT_RESULTS_COLLECTION, result.submission)
      }

      await loadAssessmentResults(studentId)
      return { ok: true, data: result }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment' }
    }
  }

  const submitAssessmentRequestResponse = async ({ assessmentId, studentId, studentName, answers, requestId }) => {
    try {
      const result = await interviewApiRequest(`/assessment/${requestId}/submit`, {
        method: 'PUT',
        body: JSON.stringify({ answers, status: 'Submitted' }),
      })

      if (result?.request) {
        await syncEntityToFirestore(WORKFLOW_REQUESTS_COLLECTION, result.request)
      }

      await loadAssessmentResults(studentId)
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
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
      loadStudentAssessments(String(currentStudent.id))
      loadStudentWorkflowRequests(String(currentStudent.id))
      loadStudentInterviewRequests(String(currentStudent.id))
    }
  }, [currentStudent?.id])

  useEffect(() => {
    if (!currentStudent?.id || currentUser?.role !== 'student') {
      return undefined
    }

    const intervalId = setInterval(() => {
      loadStudentAssessments(String(currentStudent.id))
      loadStudentWorkflowRequests(String(currentStudent.id))
      loadStudentInterviewRequests(String(currentStudent.id))
    }, 10000)

    return () => clearInterval(intervalId)
  }, [currentStudent?.id, currentUser?.role])

  const studentWorkflowRequests = useMemo(() => {
    if (!currentStudent?.id) {
      return []
    }

    return workflowRequests.filter((request) => String(request.studentId) === String(currentStudent.id))
  }, [workflowRequests, currentStudent?.id])

  const studentInterviewRequests = useMemo(() => {
    return studentWorkflowRequests
      .filter((request) => request.type === 'interview')
      .sort((a, b) => Number(new Date(b?.createdAt || b?.scheduledDate || 0)) - Number(new Date(a?.createdAt || a?.scheduledDate || 0)))
  }, [studentWorkflowRequests])

  const studentAssessmentRequests = useMemo(() => {
    return studentAssessments.length ? studentAssessments : studentWorkflowRequests.filter((request) => request.type === 'assessment')
  }, [studentAssessments, studentWorkflowRequests])

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
    studentAssessments,
    currentUser,
    currentStudent,
    currentUserAccount,
    registerUser,
    loginUser,
    logoutUser,
    addStudent,
    updateStudent,
    updateCurrentStudentProfile,
    deleteStudent,
    updateUserProfile,
    submitMockInterviewRequest,
    updateMockInterviewRequestStatus,
    addInterviewFeedback,
    createAssessment,
    requestAssessment,
    acceptAssessmentRequest,
    submitAssessmentAttempt,
    evaluateAssessmentRequest,
    publishAssessmentRequest,
    deleteAssessment,
    submitAssessment,
    submitAssessmentRequestResponse,
    sendInterviewRequest,
    acceptInterviewRequest,
    completeInterviewRequest,
    startAssessmentRequest,
    saveInterviewResult,
    publishInterviewRequest,
    sendAssessmentRequest,
    updateWorkflowRequestStatus,
    publishInterviewResult,
    publishAssessmentResult,
    getAssessmentById,
    getStudentFullPerformance,
    loadInterviewRequests,
    loadWorkflowRequests,
    loadStudentWorkflowRequests,
    loadStudentInterviewRequests,
    loadStudentAssessments,
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
