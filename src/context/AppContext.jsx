import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AUTH_KEY = 'sps_auth_user'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function normalizeStudentName(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
}

function parseFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

async function apiRequest(path, options = {}) {
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
    const message = data?.message || 'Request failed'
    throw new Error(message)
  }

  return data
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [users, setUsers] = useState([])
  const [students, setStudents] = useState([])
  const [currentUser, setCurrentUser] = useState(() => parseFromStorage(AUTH_KEY, null))

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const loadedStudents = await apiRequest('/students')
        setStudents(loadedStudents)
      } catch {
        setStudents([])
      }
    }

    loadStudents()
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }, [currentUser])

  const registerUser = ({ username, email, password }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
      .then(() => ({ ok: true }))
      .catch((error) => ({ ok: false, message: error.message }))
  }

  const loginUser = ({ username, password, loginType = 'student' }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, loginType }),
    })
      .then((result) => {
        setCurrentUser(result.user)
        return result
      })
      .catch((error) => ({ ok: false, message: error.message }))
  }

  const logoutUser = () => {
    localStorage.removeItem(AUTH_KEY)
    setCurrentUser(null)
  }

  const addStudent = ({ name, birthYear, attendance, marks, interactionScore }) => {
    return apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify({ name, birthYear, attendance, marks, interactionScore }),
    })
      .then(async (result) => {
        const loadedStudents = await apiRequest('/students')
        setStudents(loadedStudents)
        return { ok: true, username: result.username, password: result.password }
      })
      .catch((error) => ({ ok: false, message: error.message }))
  }

  const updateStudent = (id, payload) => {
    return apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then(async () => {
      const loadedStudents = await apiRequest('/students')
      setStudents(loadedStudents)
    })
  }

  const deleteStudent = (id) => {
    return apiRequest(`/students/${id}`, {
      method: 'DELETE',
    }).then(async () => {
      const loadedStudents = await apiRequest('/students')
      setStudents(loadedStudents)
    })
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
