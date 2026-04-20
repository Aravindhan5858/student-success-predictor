"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AUTH_KEY = 'sps_auth_user'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

function parseFromStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setAuthCookies(user) {
  if (typeof document === 'undefined') {
    return
  }

  if (!user) {
    document.cookie = 'sps_auth=; Path=/; Max-Age=0; SameSite=Lax'
    document.cookie = 'sps_role=; Path=/; Max-Age=0; SameSite=Lax'
    document.cookie = 'sps_username=; Path=/; Max-Age=0; SameSite=Lax'
    return
  }

  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `sps_auth=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  document.cookie = `sps_role=${encodeURIComponent(user.role || 'student')}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  document.cookie = `sps_username=${encodeURIComponent(user.username || '')}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
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

  const apiRequest = useCallback(async (path, options = {}) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const baseCandidates = Array.from(new Set([API_BASE_URL, '/api'].filter(Boolean)))

    let lastError = null

    for (const base of baseCandidates) {
      try {
        const response = await fetch(`${String(base).replace(/\/$/, '')}${normalizedPath}`, {
          cache: 'no-store',
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
          throw new Error(data?.message || `Request failed (${response.status})`)
        }

        return data
      } catch (error) {
        lastError = error
      }
    }

    throw new Error(lastError?.message || 'API request failed')
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiRequest('/users')
      const normalized = Array.isArray(data) ? data : []
      setUsers(normalized)
      return normalized
    } catch {
      setUsers([])
      return []
    }
  }, [apiRequest])

  const loadStudents = useCallback(async () => {
    try {
      const data = await apiRequest('/students')
      const normalized = Array.isArray(data) ? data : []
      setStudents(normalized)
      return normalized
    } catch {
      setStudents([])
      return []
    }
  }, [apiRequest])

  const loadMockInterviewRequests = useCallback(async () => {
    try {
      const data = await apiRequest('/interview-requests')
      const normalized = Array.isArray(data) ? data : []
      setMockInterviewRequests(normalized)
      return normalized
    } catch {
      setMockInterviewRequests([])
      return []
    }
  }, [apiRequest])

  const loadInterviews = useCallback(async () => {
    try {
      const data = await apiRequest('/interviews')
      const normalized = Array.isArray(data) ? data : []
      setInterviews(normalized)
      return normalized
    } catch {
      setInterviews([])
      return []
    }
  }, [apiRequest])

  const loadInterviewRequests = useCallback(async () => {
    try {
      const data = await apiRequest('/interview-requests')
      const normalized = Array.isArray(data) ? data : []
      setInterviewRequests(normalized)
      setMockInterviewRequests(normalized)
      return normalized
    } catch {
      setInterviewRequests([])
      setMockInterviewRequests([])
      return []
    }
  }, [apiRequest])

  const loadWorkflowRequests = useCallback(
    async (type) => {
      try {
        const query = type ? `?type=${encodeURIComponent(type)}` : ''
        const data = await apiRequest(`/requests${query}`)
        const normalized = Array.isArray(data) ? data : []
        setWorkflowRequests(normalized)
        return normalized
      } catch {
        setWorkflowRequests([])
        return []
      }
    },
    [apiRequest],
  )

  const loadStudentWorkflowRequests = useCallback(
    async (studentId) => {
      try {
        if (!studentId) {
          setWorkflowRequests([])
          return []
        }

        const data = await apiRequest(`/student/${studentId}/requests`)
        const normalized = Array.isArray(data) ? data : []
        setWorkflowRequests(normalized)
        return normalized
      } catch {
        setWorkflowRequests([])
        return []
      }
    },
    [apiRequest],
  )

  const loadStudentInterviewRequests = useCallback(
    async (studentId) => {
      try {
        if (!studentId) {
          return []
        }

        const data = await apiRequest(`/student/${studentId}/interviews`)
        const normalized = Array.isArray(data) ? data : []

        setWorkflowRequests((previous) => {
          const existing = Array.isArray(previous) ? previous : []
          const nonInterview = existing.filter((item) => !(item?.type === 'interview' && String(item?.studentId) === String(studentId)))
          return [...normalized, ...nonInterview].sort((a, b) => Number(new Date(b?.createdAt || b?.scheduledDate || 0)) - Number(new Date(a?.createdAt || a?.scheduledDate || 0)))
        })

        return normalized
      } catch {
        return []
      }
    },
    [apiRequest],
  )

  const loadStudentAssessments = useCallback(
    async (studentId) => {
      try {
        if (!studentId) {
          setStudentAssessments([])
          return []
        }

        const data = await apiRequest(`/student/${studentId}/assessments`)
        const normalized = Array.isArray(data) ? data : []
        setStudentAssessments(normalized)
        return normalized
      } catch {
        setStudentAssessments([])
        return []
      }
    },
    [apiRequest],
  )

  const loadAssessments = useCallback(
    async (studentId) => {
      try {
        const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''
        const data = await apiRequest(`/assessments${query}`)
        const normalized = Array.isArray(data) ? data : []
        setAssessments(normalized)
        return normalized
      } catch {
        setAssessments([])
        return []
      }
    },
    [apiRequest],
  )

  const loadAssessmentResults = useCallback(
    async (studentId) => {
      try {
        if (!studentId) {
          setAssessmentResults([])
          return []
        }

        const data = await apiRequest(`/assessment/results/${studentId}`)
        const normalized = Array.isArray(data) ? data : []
        setAssessmentResults(normalized)
        return normalized
      } catch {
        setAssessmentResults([])
        return []
      }
    },
    [apiRequest],
  )

  const getAssessmentById = useCallback(
    async (assessmentId) => {
      return apiRequest(`/assessments/${assessmentId}`)
    },
    [apiRequest],
  )

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadUsers(),
        loadStudents(),
        loadMockInterviewRequests(),
        loadInterviews(),
        loadInterviewRequests(),
        loadWorkflowRequests(),
        loadAssessments(),
      ])
    }

    loadInitialData()
  }, [loadUsers, loadStudents, loadMockInterviewRequests, loadInterviews, loadInterviewRequests, loadWorkflowRequests, loadAssessments])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (currentUser) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
      setAuthCookies(currentUser)
    } else {
      window.localStorage.removeItem(AUTH_KEY)
      setAuthCookies(null)
    }
  }, [currentUser])

  const registerUser = async ({ username, email, password }) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })

      await Promise.all([loadUsers(), loadStudents()])
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Registration failed' }
    }
  }

  const loginUser = async ({ username, password, loginType = 'student' }) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, loginType }),
      })

      if (data?.user) {
        setCurrentUser(data.user)
      }

      return {
        ok: true,
        user: data?.user,
        redirectTo: data?.redirectTo || '/login',
      }
    } catch (error) {
      return { ok: false, message: error.message || 'Login failed' }
    }
  }

  const logoutUser = () => {
    setCurrentUser(null)
  }

  const addStudent = async (payload) => {
    try {
      const data = await apiRequest('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await Promise.all([loadUsers(), loadStudents()])
      return { ok: true, ...data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to add student' }
    }
  }

  const updateStudent = async (id, payload) => {
    try {
      await apiRequest(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      await Promise.all([loadUsers(), loadStudents()])
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update student' }
    }
  }

  const currentStudent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null
    }

    return students.find((student) => String(student.username).toLowerCase() === String(currentUser.username).toLowerCase()) ?? null
  }, [currentUser, students])

  const currentUserAccount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null
    }

    return users.find((user) => String(user.username).toLowerCase() === String(currentUser.username).toLowerCase()) ?? null
  }, [currentUser, users])

  const updateCurrentStudentProfile = async (payload) => {
    if (!currentStudent?.id) {
      return { ok: false, message: 'Student profile not found' }
    }

    const merged = {
      ...currentStudent,
      ...payload,
      birthYear: payload.birthYear ?? currentStudent.birthYear ?? '2005',
      attendance: payload.attendance ?? currentStudent.attendance ?? 75,
      marks: payload.marks ?? currentStudent.marks ?? 70,
      interactionScore: payload.interactionScore ?? currentStudent.interactionScore ?? 72,
    }

    return updateStudent(currentStudent.id, merged)
  }

  const deleteStudent = async (id) => {
    try {
      await apiRequest(`/students/${id}`, {
        method: 'DELETE',
      })

      await Promise.all([loadUsers(), loadStudents()])
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to delete student' }
    }
  }

  const updateUserProfile = async ({ email, password }) => {
    if (!currentUserAccount?.id) {
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
      await apiRequest(`/users/${currentUserAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      })

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

      await apiRequest('/interview-request', {
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
      await apiRequest(`/interview-request/${requestId}/status`, {
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
      const data = await apiRequest('/interviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await loadInterviews()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create interview' }
    }
  }

  const sendInterviewRequest = async (payload) => {
    try {
      let data

      try {
        data = await apiRequest('/request/interview', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } catch {
        data = await apiRequest('/interview/schedule', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await loadWorkflowRequests('interview')
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send interview request' }
    }
  }

  const acceptInterviewRequest = async (requestId) => {
    try {
      const data = await apiRequest(`/interview/${requestId}/accept`, {
        method: 'PUT',
      })

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to accept interview request' }
    }
  }

  const completeInterviewRequest = async (requestId) => {
    try {
      const data = await apiRequest(`/interview/${requestId}/complete`, {
        method: 'PUT',
      })

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to complete interview request' }
    }
  }

  const saveInterviewResult = async ({ requestId, technicalScore = 0, communication = 0, confidence = 0, remarks = '', feedback = '' }) => {
    try {
      const data = await apiRequest(`/interview/${requestId}/result`, {
        method: 'POST',
        body: JSON.stringify({ technicalScore, communication, confidence, remarks, feedback }),
      })

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to save interview result' }
    }
  }

  const publishInterviewRequest = async ({ requestId, technicalScore = 0, communication = 0, confidence = 0, remarks = '', feedback = '' }) => {
    try {
      const data = await apiRequest(`/interview/${requestId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ technicalScore, communication, confidence, remarks, feedback }),
      })

      await loadWorkflowRequests('interview')
      if (currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish interview result' }
    }
  }

  const sendAssessmentRequest = async (payload) => {
    try {
      const data = await apiRequest('/assessment/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await loadWorkflowRequests('assessment')
      if (payload.studentId) {
        await loadStudentAssessments(String(payload.studentId))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to send assessment request' }
    }
  }

  const requestAssessment = sendAssessmentRequest

  const acceptAssessmentRequest = async (requestId) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/accept`, {
        method: 'PUT',
      })

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to accept assessment request' }
    }
  }

  const startAssessmentRequest = async (requestId) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/start`, {
        method: 'PUT',
      })

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to start assessment' }
    }
  }

  const submitAssessmentAttempt = async ({ requestId, answers = [] }) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/submit`, {
        method: 'PUT',
        body: JSON.stringify({ answers }),
      })

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment attempt' }
    }
  }

  const evaluateAssessmentRequest = async ({ requestId, evaluation = [], score = 0, percentage = 0, resultStatus = '', feedback = '' }) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ evaluation, score, percentage, resultStatus, feedback }),
      })

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to evaluate assessment request' }
    }
  }

  const publishAssessmentRequest = async ({ requestId, score = 0, percentage = 0, resultStatus = '', feedback = '' }) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ score, percentage, resultStatus, feedback }),
      })

      await loadWorkflowRequests('assessment')
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish assessment result' }
    }
  }

  const updateWorkflowRequestStatus = async (requestId, status) => {
    try {
      const data = await apiRequest(`/request/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests()
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update request status' }
    }
  }

  const publishInterviewResult = async (payload) => {
    try {
      const data = payload?.requestId
        ? await apiRequest(`/interview/${payload.requestId}/publish`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiRequest('/interview/result', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentInterviewRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests('interview')
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish interview result' }
    }
  }

  const publishAssessmentResult = async (payload) => {
    try {
      const data = await apiRequest('/assessment/result', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (currentUser?.role === 'student' && currentStudent?.id) {
        await loadStudentWorkflowRequests(String(currentStudent.id))
      } else {
        await loadWorkflowRequests('assessment')
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to publish assessment result' }
    }
  }

  const updateInterview = async (id, payload) => {
    try {
      const data = await apiRequest(`/interviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      await loadInterviews()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update interview' }
    }
  }

  const addInterviewFeedback = async ({ interviewId, communication, technicalSkills, confidence, remarks }) => {
    try {
      const data = await apiRequest('/interview-feedback', {
        method: 'POST',
        body: JSON.stringify({ interviewId, communication, technicalSkills, confidence, remarks }),
      })

      await loadInterviews()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to add interview feedback' }
    }
  }

  const createAssessment = async (payload) => {
    try {
      const data = await apiRequest('/assessment/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      await loadAssessments()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create assessment' }
    }
  }

  const deleteAssessment = async (assessmentId) => {
    try {
      await apiRequest(`/assessments/${assessmentId}`, {
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
      const data = await apiRequest('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ assessmentId, studentId, studentName, answers, requestId: '', status: 'Submitted' }),
      })

      await loadAssessmentResults(studentId)
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment' }
    }
  }

  const submitAssessmentRequestResponse = async ({ studentId, answers, requestId }) => {
    try {
      const data = await apiRequest(`/assessment/${requestId}/submit`, {
        method: 'PUT',
        body: JSON.stringify({ answers, status: 'Submitted' }),
      })

      await loadAssessmentResults(studentId)
      if (currentStudent?.id) {
        await loadStudentAssessments(String(currentStudent.id))
        await loadStudentWorkflowRequests(String(currentStudent.id))
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to submit assessment' }
    }
  }

  const getStudentFullPerformance = async (studentId) => {
    try {
      const data = await apiRequest(`/student/${studentId}/full-performance`)
      return { ok: true, data }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to fetch full performance' }
    }
  }

  const deleteInterview = async (id) => {
    try {
      await apiRequest(`/interviews/${id}`, {
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
  }, [currentStudent?.id, loadAssessmentResults, loadAssessments, loadStudentAssessments, loadStudentWorkflowRequests, loadStudentInterviewRequests])

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
  }, [currentStudent?.id, currentUser?.role, loadStudentAssessments, loadStudentWorkflowRequests, loadStudentInterviewRequests])

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
