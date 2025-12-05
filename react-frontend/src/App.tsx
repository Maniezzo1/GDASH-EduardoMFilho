import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "./components/ui/toaster"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import UsersPage from "./pages/UsersPage"
import ExplorePage from "./pages/ExplorePage"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="explore" element={<ExplorePage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  )
}

export default App
