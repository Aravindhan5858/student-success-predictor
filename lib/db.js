import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbPromise = null;

function normalizeStudentName(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function buildStudentPassword(name, birthYear) {
  return `${normalizeStudentName(name)}${birthYear}`;
}

function getRiskLevel(score) {
  if (score >= 80) return "Low";
  if (score >= 60) return "Medium";
  return "High";
}

function calculatePredictedScore(attendance, marks, interactionScore) {
  return Math.round(attendance * 0.35 + marks * 0.4 + interactionScore * 0.25);
}

const seededStudents = [
  {
    name: "Aarav Patel",
    birthYear: "2005",
    attendance: 96,
    marks: 92,
    interactionScore: 88,
  },
  {
    name: "Maya Singh",
    birthYear: "2006",
    attendance: 68,
    marks: 71,
    interactionScore: 64,
  },
  {
    name: "Rahul Verma",
    birthYear: "2005",
    attendance: 81,
    marks: 77,
    interactionScore: 75,
  },
];

export async function initDb() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    const dbDir = path.join(process.cwd(), "data");
    await fs.mkdir(dbDir, { recursive: true });

    const db = await open({
      filename: path.join(dbDir, "data.sqlite"),
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthYear TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        attendance INTEGER NOT NULL,
        marks INTEGER NOT NULL,
        interactionScore INTEGER NOT NULL,
        riskLevel TEXT NOT NULL,
        predictedScore INTEGER NOT NULL,
        address TEXT DEFAULT '',
        age TEXT DEFAULT '',
        bloodGroup TEXT DEFAULT '',
        gender TEXT DEFAULT '',
        mobileNumber TEXT DEFAULT '',
        profilePhoto TEXT DEFAULT ''
      );
    `);

    const studentColumns = await db.all("PRAGMA table_info(students)");
    const existingStudentColumns = new Set(
      studentColumns.map((column) => column.name),
    );
    const additionalStudentColumns = [
      ["address", "TEXT DEFAULT ''"],
      ["age", "TEXT DEFAULT ''"],
      ["bloodGroup", "TEXT DEFAULT ''"],
      ["gender", "TEXT DEFAULT ''"],
      ["mobileNumber", "TEXT DEFAULT ''"],
      ["profilePhoto", "TEXT DEFAULT ''"],
    ];

    for (const [name, definition] of additionalStudentColumns) {
      if (!existingStudentColumns.has(name)) {
        await db.exec(`ALTER TABLE students ADD COLUMN ${name} ${definition}`);
      }
    }

    const studentCountRow = await db.get(
      "SELECT COUNT(*) as count FROM students",
    );
    if (!studentCountRow || studentCountRow.count === 0) {
      for (const seeded of seededStudents) {
        const username = normalizeStudentName(seeded.name);
        const password = buildStudentPassword(seeded.name, seeded.birthYear);
        const predictedScore = calculatePredictedScore(
          seeded.attendance,
          seeded.marks,
          seeded.interactionScore,
        );
        const riskLevel = getRiskLevel(predictedScore);

        await db.run(
          `INSERT INTO students (name, birthYear, username, password, attendance, marks, interactionScore, riskLevel, predictedScore)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          seeded.name,
          seeded.birthYear,
          username,
          password,
          seeded.attendance,
          seeded.marks,
          seeded.interactionScore,
          riskLevel,
          predictedScore,
        );

        await db.run(
          `INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')`,
          username,
          `${username}@example.com`,
          password,
        );
      }
    }

    return db;
  })();

  return dbPromise;
}

export function dbUtils() {
  return {
    normalizeStudentName,
    buildStudentPassword,
    getRiskLevel,
    calculatePredictedScore,
  };
}
