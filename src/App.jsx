import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from './layouts/ProtectedLayout'
import AddStudent from './pages/AddStudent'
import AdminAssessmentRequests from './pages/AdminAssessmentRequests'
import AdminEvaluateAssessment from './pages/AdminEvaluateAssessment'
import AdminInterviewResult from './pages/AdminInterviewResult'
import AdminInterviewRequests from './pages/AdminInterviewRequests'
import AdminInterviews from './pages/AdminInterviews'
import AdminScheduleInterview from './pages/AdminScheduleInterview'
import AdminPublishResult from './pages/AdminPublishResult'
import AdminSendAssessment from './pages/AdminSendAssessment'
import Assessments from './pages/Assessments'
import CreateAssessment from './pages/CreateAssessment'
import Dashboard from './pages/Dashboard'
import EditStudent from './pages/EditStudent'
import Evaluation from './pages/Evaluation'
import Login from './pages/Login'
import ModelTraining from './pages/ModelTraining'
import MockInterviewContact from './pages/MockInterviewContact'
import MockInterviewRequests from './pages/MockInterviewRequests'
import InterviewManagement from './pages/InterviewManagement'
import MyResults from './pages/MyResults'
import MyInterviews from './pages/MyInterviews'
import MyAssessments from './pages/MyAssessments'
import NotFound from './pages/NotFound'
import PlacementDashboard from './pages/PlacementDashboard'
import Prediction from './pages/Prediction'
import Profile from './pages/Profile'
import MyRequests from './pages/MyRequests'
import Register from './pages/Register'
import RequestInterview from './pages/RequestInterview'
import ScheduleInterview from './pages/ScheduleInterview'
import StudentDashboard from './pages/StudentDashboard'
import StudentDetails from './pages/StudentDetails'
import StudentAssessmentResult from './pages/StudentAssessmentResult'
import StudentAssessments from './pages/StudentAssessments'
import StudentInterviewResult from './pages/StudentInterviewResult'
import StudentInterviews from './pages/StudentInterviews'
import Students from './pages/Students'
import TakeAssessment from './pages/TakeAssessment'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import RoleRoute from './routes/RoleRoute'

const withPageAnimation = (node) => <div className="page-transition">{node}</div>

function App() {
  return (
    <div className="neon-theme">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            {withPageAnimation(<Login />)}
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            {withPageAnimation(<Register />)}
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
        <Route
          path="/placement-dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <PlacementDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/interviews"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminInterviews />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/schedule-interview"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminScheduleInterview />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/interview-result/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminInterviewResult />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminAssessmentRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assessment-requests"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminAssessmentRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/send-assessment"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminSendAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/evaluate/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminEvaluateAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/publish/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminPublishResult />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/publish-result/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminPublishResult />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assessment-result/:id"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminPublishResult />
            </RoleRoute>
          }
        />
        <Route
          path="/schedule-interview"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ScheduleInterview />
            </RoleRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <InterviewManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/mock-interview-requests"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <MockInterviewRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/interview-requests"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminInterviewRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/create-assessment"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <CreateAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/create-assessment"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <CreateAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/assessments"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Assessments />
            </RoleRoute>
          }
        />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student/:id" element={<StudentDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/my-interviews"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MyInterviews />
            </RoleRoute>
          }
        />
        <Route
          path="/student/interviews"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentInterviews />
            </RoleRoute>
          }
        />
        <Route
          path="/student/interview-result"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentInterviewResult />
            </RoleRoute>
          }
        />
        <Route
          path="/student/assessments"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentAssessments />
            </RoleRoute>
          }
        />
        <Route
          path="/student/take-assessment/:id"
          element={
            <RoleRoute allowedRoles={['student']}>
              <TakeAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/student/assessment-result"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentAssessmentResult />
            </RoleRoute>
          }
        />
        <Route
          path="/assessment-result"
          element={
            <RoleRoute allowedRoles={['student']}>
              <Navigate to="/student/assessment-result" replace />
            </RoleRoute>
          }
        />
        <Route
          path="/my-assessments"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MyAssessments />
            </RoleRoute>
          }
        />
        <Route
          path="/mock-interview-contact"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MockInterviewContact />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/request-interview"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <MockInterviewContact />
            </RoleRoute>
          }
        />
        <Route
          path="/request-interview"
          element={
            <RoleRoute allowedRoles={['student']}>
              <RequestInterview />
            </RoleRoute>
          }
        />
        <Route
          path="/take-assessment/:id"
          element={
            <RoleRoute allowedRoles={['student']}>
              <TakeAssessment />
            </RoleRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MyResults />
            </RoleRoute>
          }
        />
        <Route
          path="/my-results"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MyResults />
            </RoleRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <RoleRoute allowedRoles={['student']}>
              <MyRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/my-request"
          element={
            <RoleRoute allowedRoles={['student']}>
              <Navigate to="/my-requests" replace />
            </RoleRoute>
          }
        />
      </Route>

        <Route path="/404" element={withPageAnimation(<NotFound />)} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  )
}

export default App
