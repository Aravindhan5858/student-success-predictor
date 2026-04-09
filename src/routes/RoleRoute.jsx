import { Navigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

function RoleRoute({ allowedRoles, children }) {
  const { currentUser } = useAppContext()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={currentUser.role === 'student' ? '/student-dashboard' : '/dashboard'} replace />
  }

  return children
}

export default RoleRoute
