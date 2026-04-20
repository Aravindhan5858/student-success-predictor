import { Navigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

function PublicOnlyRoute({ children }) {
  const { currentUser } = useAppContext()

  if (currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/student-dashboard'} replace />
  }

  return children
}

export default PublicOnlyRoute
