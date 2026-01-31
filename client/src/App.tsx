import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/Layout'
import { Welcome } from './pages/Welcome'
import { JobList } from './pages/JobList'
import { JobDetail } from './pages/JobDetail'
import { PostJob } from './pages/PostJob'
import { Profile } from './pages/Profile'
import { UserProfile } from './pages/UserProfile'
import { MyApplications } from './pages/MyApplications'
import { MyJobs } from './pages/MyJobs'
import { Messages } from './pages/Messages'
import { ConversationPage } from './pages/Conversation'
import { Register } from './pages/Register'
import { Login } from './pages/Login'
import { Notifications } from './pages/Notifications'
import { EditProfile } from './pages/EditProfile'

function App() {
    const { isAuthenticated, hasLocation } = useAuthStore()

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={
                    !hasLocation ? <Welcome /> : <Navigate to="/jobs" replace />
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Routes with layout */}
                <Route element={<Layout />}>
                    <Route path="/jobs" element={<JobList />} />
                    <Route path="/jobs/:id" element={<JobDetail />} />
                    <Route path="/user/:id" element={<UserProfile />} />

                    {/* Protected routes */}
                    <Route path="/post-job" element={
                        isAuthenticated ? <PostJob /> : <Navigate to="/register?type=employer" replace />
                    } />
                    <Route path="/profile" element={
                        isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/profile/edit" element={
                        isAuthenticated ? <EditProfile /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/my-applications" element={
                        isAuthenticated ? <MyApplications /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/my-jobs" element={
                        isAuthenticated ? <MyJobs /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/messages" element={
                        isAuthenticated ? <Messages /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/messages/:conversationId" element={
                        isAuthenticated ? <ConversationPage /> : <Navigate to="/login" replace />
                    } />
                    <Route path="/notifications" element={
                        isAuthenticated ? <Notifications /> : <Navigate to="/login" replace />
                    } />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
