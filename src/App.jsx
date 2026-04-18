import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from './layouts/ProtectedLayout'
import AddStudent from './pages/AddStudent'
import Dashboard from './pages/Dashboard'
import EditStudent from './pages/EditStudent'
import Evaluation from './pages/Evaluation'
import Login from './pages/Login'
import ModelTraining from './pages/ModelTraining'
import NotFound from './pages/NotFound'
import Prediction from './pages/Prediction'
import Profile from './pages/Profile'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import StudentDetails from './pages/StudentDetails'
import Students from './pages/Students'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import RoleRoute from './routes/RoleRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/students"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Students />
            </RoleRoute>
          }
        />
        <Route
          path="/add-student"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AddStudent />
            </RoleRoute>
          }
        />
        <Route
          path="/edit-student/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <EditStudent />
            </RoleRoute>
          }
        />
        <Route
          path="/prediction"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Prediction />
            </RoleRoute>
          }
        />
        <Route
          path="/model-training"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ModelTraining />
            </RoleRoute>
          }
        />
        <Route
          path="/evaluation"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Evaluation />
            </RoleRoute>
          }
        />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student/:id" element={<StudentDetails />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
