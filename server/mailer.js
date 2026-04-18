import nodemailer from 'nodemailer'

let transporter

async function getTransporter() {
  if (transporter) {
    return transporter
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    return transporter
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  })

  return transporter
}

export async function sendMockInterviewInvite({ studentName, studentEmail, interviewDateTime, interviewType, meetingLink }) {
  const activeTransporter = await getTransporter()

  const date = new Date(interviewDateTime)
  const formattedDate = date.toLocaleDateString()
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const mail = {
    from: process.env.MAIL_FROM || 'admin@student-success.local',
    to: studentEmail,
    subject: 'Mock Interview Invitation',
    text: `Hello ${studentName},\n\nYou have been scheduled for a mock interview.\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nType: ${interviewType}\n\nJoin Link:\n${meetingLink}\n\nPlease be prepared.\n\nRegards,\nAdmin`,
  }

  const info = await activeTransporter.sendMail(mail)
  return info
}
