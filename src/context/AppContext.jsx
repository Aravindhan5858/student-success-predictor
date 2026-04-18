import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, where, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const AUTH_KEY = 'sps_auth_user'
const USERS_COLLECTION = 'users'
const STUDENTS_COLLECTION = 'students'
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
  const [currentUser, setCurrentUser] = useState(() => parseFromStorage(AUTH_KEY, null))

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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([loadUsers(), loadStudents()])
      } catch {
        setUsers([])
        setStudents([])
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

  const value = {
    users,
    students,
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
