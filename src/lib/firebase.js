import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCpX4z5mXhUKK4kZ63jkHyaazkZrERwvfk',
  authDomain: 'student-6f9cb.firebaseapp.com',
  projectId: 'student-6f9cb',
  storageBucket: 'student-6f9cb.firebasestorage.app',
  messagingSenderId: '251145757809',
  appId: '1:251145757809:web:e32cb521de15fa8944e7d0',
  measurementId: 'G-V70GM5N0F9',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)

let analytics
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp)
      }
    })
    .catch(() => undefined)
}

export { analytics }
