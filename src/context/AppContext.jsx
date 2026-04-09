import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const USERS_KEY = 'sps_users'
const AUTH_KEY = 'sps_auth_user'
const STUDENTS_KEY = 'sps_students'

function normalizeStudentName(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
}

function buildStudentPassword(name, birthYear) {
  return `${normalizeStudentName(name)}${birthYear}`
}

const seededStudents = [
  {
    id: 1,
    name: 'Aarav Patel',
    birthYear: '2005',
    username: 'aaravpatel',
    password: 'aaravpatel2005',
    attendance: 96,
    marks: 92,
    interactionScore: 88,
    riskLevel: 'Low',
    predictedScore: 94,
  },
  {
    id: 2,
    name: 'Maya Singh',
    birthYear: '2006',
    username: 'mayasingh',
    password: 'mayasingh2006',
    attendance: 68,
    marks: 71,
    interactionScore: 64,
    riskLevel: 'High',
    predictedScore: 62,
  },
  {
    id: 3,
    name: 'Rahul Verma',
    birthYear: '2005',
    username: 'rahulverma',
    password: 'rahulverma2005',
    attendance: 81,
    marks: 77,
    interactionScore: 75,
    riskLevel: 'Medium',
    predictedScore: 78,
  },
]

const seededUsers = seededStudents.map((student) => {
  const username = normalizeStudentName(student.name)
  const password = buildStudentPassword(student.name, student.birthYear)
  return {
    username,
    email: `${username}@example.com`,
    password,
    role: 'student',
  }
})

function parseFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getRiskLevel(score) {
  if (score >= 80) return 'Low'
  if (score >= 60) return 'Medium'
  return 'High'
}

function calculatePredictedScore(attendance, marks, interactionScore) {
  return Math.round(attendance * 0.35 + marks * 0.4 + interactionScore * 0.25)
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [users, setUsers] = useState(() => parseFromStorage(USERS_KEY, seededUsers))
  const [students, setStudents] = useState(() => parseFromStorage(STUDENTS_KEY, seededStudents))
  const [currentUser, setCurrentUser] = useState(() => parseFromStorage(AUTH_KEY, null))

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
  }, [students])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }, [currentUser])

  const registerUser = ({ username, email, password }) => {
    const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase())
    if (exists || username.toLowerCase() === 'admin') {
      return { ok: false, message: 'Username already exists' }
    }

    const newUser = { username, email, password, role: 'student' }
    setUsers((prev) => [...prev, newUser])

    setStudents((prev) => {
      if (prev.some((student) => student.username.toLowerCase() === username.toLowerCase())) {
        return prev
      }

      const attendance = 75
      const marks = 70
      const interactionScore = 72
      const predictedScore = calculatePredictedScore(attendance, marks, interactionScore)

      return [
        ...prev,
        {
          id: Date.now(),
          username,
          password,
          name: username,
          attendance,
          marks,
          interactionScore,
          riskLevel: getRiskLevel(predictedScore),
          predictedScore,
        },
      ]
    })

    return { ok: true }
  }

  const loginUser = ({ username, password, loginType = 'student' }) => {
    if (loginType === 'admin') {
      if (!(username === 'admin' && password === 'admin123')) {
        return { ok: false, message: 'Invalid admin credentials' }
      }

      const authUser = { username: 'admin', role: 'admin', userId: 'ADMIN-001' }
      setCurrentUser(authUser)
      return { ok: true, user: authUser, redirectTo: '/dashboard' }
    }

    const normalizedInput = normalizeStudentName(username)
    const mappedStudent = students.find(
      (student) =>
        student.username === normalizedInput ||
        student.name.toLowerCase() === username.trim().toLowerCase(),
    )

    if (!mappedStudent) {
      return { ok: false, message: 'Invalid credentials' }
    }

    const expectedPassword = buildStudentPassword(mappedStudent.name, mappedStudent.birthYear)
    const isLegacyPasswordValid = mappedStudent.password === password

    if (password !== expectedPassword && !isLegacyPasswordValid) {
      return { ok: false, message: 'Invalid credentials' }
    }

    const authUser = {
      username: mappedStudent.username,
      role: 'student',
      userId: `STU-${mappedStudent.id}`,
    }
    setCurrentUser(authUser)

    return {
      ok: true,
      user: authUser,
      redirectTo: '/student-dashboard',
    }
  }

  const logoutUser = () => {
    localStorage.clear()
    setUsers(seededUsers)
    setStudents(seededStudents)
    setCurrentUser(null)
  }

  const addStudent = ({ name, birthYear, attendance, marks, interactionScore }) => {
    const normalizedUsername = normalizeStudentName(name)
    if (!normalizedUsername) {
      return { ok: false, message: 'Student name is required' }
    }

    if (!birthYear || String(birthYear).length !== 4) {
      return { ok: false, message: 'Valid birth year is required' }
    }

    const userExists = users.some((user) => user.username.toLowerCase() === normalizedUsername)
    if (userExists || normalizedUsername === 'admin') {
      return { ok: false, message: 'Username already exists' }
    }

    const generatedPassword = buildStudentPassword(name, birthYear)

    const predictedScore = calculatePredictedScore(Number(attendance), Number(marks), Number(interactionScore))
    const student = {
      id: Date.now(),
      name,
      birthYear: String(birthYear),
      username: normalizedUsername,
      password: generatedPassword,
      attendance: Number(attendance),
      marks: Number(marks),
      interactionScore: Number(interactionScore),
      riskLevel: getRiskLevel(predictedScore),
      predictedScore,
    }

    setStudents((prev) => [...prev, student])
    setUsers((prev) => [
      ...prev,
      {
        username: normalizedUsername,
        email: `${normalizedUsername}@example.com`,
        password: generatedPassword,
        role: 'student',
      },
    ])

    return { ok: true, username: normalizedUsername, password: generatedPassword }
  }

  const updateStudent = (id, payload) => {
    const previousStudent = students.find((student) => student.id === id)
    if (!previousStudent) {
      return
    }

    const nextUsername = normalizeStudentName(payload.name)
    const nextPassword = buildStudentPassword(payload.name, payload.birthYear)

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== id) {
          return student
        }

        const nextAttendance = Number(payload.attendance)
        const nextMarks = Number(payload.marks)
        const nextInteraction = Number(payload.interactionScore)
        const predictedScore = calculatePredictedScore(nextAttendance, nextMarks, nextInteraction)

        return {
          ...student,
          name: payload.name,
          birthYear: String(payload.birthYear),
          username: nextUsername,
          password: nextPassword,
          attendance: nextAttendance,
          marks: nextMarks,
          interactionScore: nextInteraction,
          predictedScore,
          riskLevel: getRiskLevel(predictedScore),
        }
      }),
    )

    setUsers((prev) =>
      prev.map((user) => {
        if (user.username !== previousStudent.username) {
          return user
        }

        return {
          ...user,
          username: nextUsername,
          email: `${nextUsername}@example.com`,
          password: nextPassword,
        }
      }),
    )
  }

  const deleteStudent = (id) => {
    const matched = students.find((student) => student.id === id)
    setStudents((prev) => prev.filter((student) => student.id !== id))
    if (matched) {
      setUsers((prev) => prev.filter((user) => user.username !== matched.username))
    }
  }

  const currentStudent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null
    }

    return students.find((student) => student.username === currentUser.username) ?? null
  }, [currentUser, students])

  const value = {
    users,
    students,
    currentUser,
    currentStudent,
    registerUser,
    loginUser,
    logoutUser,
    addStudent,
    updateStudent,
    deleteStudent,
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
