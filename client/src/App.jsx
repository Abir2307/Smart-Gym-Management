import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ResourcePage } from "./pages/ResourcePage";
import { ReportsPage } from "./pages/ReportsPage";
import { PlayPage } from "./pages/PlayPage";
import { resourceConfigs } from "./config/resourceConfigs";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route
              path="members"
              element={
                <ProtectedRoute roles={["Super Admin", "Staff"]}>
                  <ResourcePage config={resourceConfigs.members} />
                </ProtectedRoute>
              }
            />
            <Route
              path="trainers"
              element={
                <ResourcePage config={resourceConfigs.trainers} />
              }
            />
            <Route
              path="plans"
              element={
                <ResourcePage config={resourceConfigs.plans} />
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute roles={["Super Admin", "Staff"]}>
                  <ResourcePage config={resourceConfigs.payments} />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute roles={["Super Admin", "Staff"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="play"
              element={
                <ProtectedRoute roles={["Member"]}>
                  <PlayPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
