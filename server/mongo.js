import mongoose from 'mongoose'

let isConnected = false

export async function connectMongo() {
  if (isConnected) {
    return
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_success_predictor'
  await mongoose.connect(mongoUri)
  isConnected = true
}

export { mongoose }
