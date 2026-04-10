import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import MaterialsPage from "./pages/MaterialsPage";
import SuppliersPage from "./pages/SuppliersPage";
import AlertsPage from "./pages/AlertsPage";
import UploadPage from "./pages/UploadPage";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="upload" element={<UploadPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}