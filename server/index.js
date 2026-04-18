import cors from 'cors'
import express from 'express'
import { dbUtils, initDb } from './db.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/students', async (_req, res) => {
  const db = await initDb()
  const students = await db.all('SELECT * FROM students ORDER BY id ASC')
  res.json(students)
})

app.post('/api/students', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword, getRiskLevel, calculatePredictedScore } = dbUtils()

  const { name, birthYear, attendance, marks, interactionScore } = req.body
  const normalizedUsername = normalizeStudentName(name)

  if (!normalizedUsername) {
    return res.status(400).json({ ok: false, message: 'Student name is required' })
  }

  if (!birthYear || String(birthYear).length !== 4) {
    return res.status(400).json({ ok: false, message: 'Valid birth year is required' })
  }

  if (normalizedUsername === 'admin') {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const exists = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', normalizedUsername)
  if (exists) {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const generatedPassword = buildStudentPassword(name, birthYear)
  const numericAttendance = Number(attendance)
  const numericMarks = Number(marks)
  const numericInteraction = Number(interactionScore)
  const predictedScore = calculatePredictedScore(numericAttendance, numericMarks, numericInteraction)
  const riskLevel = getRiskLevel(predictedScore)

  const insertResult = await db.run(
    `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    name,
    String(birthYear),
    normalizedUsername,
    generatedPassword,
    numericAttendance,
    numericMarks,
    numericInteraction,
    riskLevel,
    predictedScore,
  )

  await db.run(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
    normalizedUsername,
    `${normalizedUsername}@example.com`,
    generatedPassword,
  )

  return res.status(201).json({ ok: true, id: insertResult.lastID, username: normalizedUsername, password: generatedPassword })
})

app.put('/api/students/:id', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword, getRiskLevel, calculatePredictedScore } = dbUtils()

  const studentId = Number(req.params.id)
  const previousStudent = await db.get('SELECT * FROM students WHERE id = ?', studentId)

  if (!previousStudent) {
    return res.status(404).json({ ok: false, message: 'Student not found' })
  }

  const { name, birthYear, attendance, marks, interactionScore } = req.body
  const nextUsername = normalizeStudentName(name)
  const nextPassword = buildStudentPassword(name, birthYear)

  const conflicting = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != (SELECT id FROM users WHERE username = ?)', nextUsername, previousStudent.username)
  if (conflicting) {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  const numericAttendance = Number(attendance)
  const numericMarks = Number(marks)
  const numericInteraction = Number(interactionScore)
  const predictedScore = calculatePredictedScore(numericAttendance, numericMarks, numericInteraction)
  const riskLevel = getRiskLevel(predictedScore)

  await db.run(
    `UPDATE students
     SET name = ?, birthYear = ?, username = ?, password = ?, attendance = ?, marks = ?, interactionScore = ?, riskLevel = ?, predictedScore = ?
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
    studentId,
  )

  await db.run(
    `UPDATE users
     SET username = ?, email = ?, password = ?
     WHERE username = ?`,
    nextUsername,
    `${nextUsername}@example.com`,
    nextPassword,
    previousStudent.username,
  )

  return res.json({ ok: true })
})

app.delete('/api/students/:id', async (req, res) => {
  const db = await initDb()
  const studentId = Number(req.params.id)
  const matched = await db.get('SELECT * FROM students WHERE id = ?', studentId)

  if (!matched) {
    return res.status(404).json({ ok: false, message: 'Student not found' })
  }

  await db.run('DELETE FROM students WHERE id = ?', studentId)
  await db.run('DELETE FROM users WHERE username = ?', matched.username)

  return res.json({ ok: true })
})

app.post('/api/auth/register', async (req, res) => {
  const db = await initDb()
  const { username, email, password } = req.body

  if (!username || !password || !email) {
    return res.status(400).json({ ok: false, message: 'All fields are required' })
  }

  const exists = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', username)
  if (exists || username.toLowerCase() === 'admin') {
    return res.status(400).json({ ok: false, message: 'Username already exists' })
  }

  await db.run(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
    username,
    email,
    password,
  )

  const existingStudent = await db.get('SELECT id FROM students WHERE LOWER(username) = LOWER(?)', username)
  if (!existingStudent) {
    const attendance = 75
    const marks = 70
    const interactionScore = 72
    const { calculatePredictedScore, getRiskLevel } = dbUtils()
    const predictedScore = calculatePredictedScore(attendance, marks, interactionScore)

    await db.run(
      `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      username,
      '2005',
      username,
      password,
      attendance,
      marks,
      interactionScore,
      getRiskLevel(predictedScore),
      predictedScore,
    )
  }

  return res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res) => {
  const db = await initDb()
  const { normalizeStudentName, buildStudentPassword } = dbUtils()
  const { username, password, loginType = 'student' } = req.body

  if (loginType === 'admin') {
    if (!(username === 'admin' && password === 'admin123')) {
      return res.status(401).json({ ok: false, message: 'Invalid admin credentials' })
    }

    const authUser = { username: 'admin', role: 'admin', userId: 'ADMIN-001' }
    return res.json({ ok: true, user: authUser, redirectTo: '/dashboard' })
  }

  const normalizedInput = normalizeStudentName(username)
  const mappedStudent = await db.get(
    `SELECT * FROM students WHERE username = ? OR LOWER(name) = LOWER(?)`,
    normalizedInput,
    username.trim(),
  )

  if (!mappedStudent) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' })
  }

  const expectedPassword = buildStudentPassword(mappedStudent.name, mappedStudent.birthYear)
  const isLegacyPasswordValid = mappedStudent.password === password

  if (password !== expectedPassword && !isLegacyPasswordValid) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' })
  }

  const authUser = {
    username: mappedStudent.username,
    role: 'student',
    userId: `STU-${mappedStudent.id}`,
  }

  return res.json({ ok: true, user: authUser, redirectTo: '/student-dashboard' })
})

app.listen(port, async () => {
  await initDb()
  console.log(`API running on http://localhost:${port}`)
})
