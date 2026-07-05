// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { ToastProvider } from "./components/common/ToastContainer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/organizations/Organizations";
import OrganizationForm from "./pages/organizations/OrganizationForm";
import OrganizationDetail from "./pages/organizations/OrganizationDetail";
import OrganizationLevels from "./pages/organization-levels/OrganizationLevels";
import OrganizationTypes from "./pages/organization-types/OrganizationTypes";
import Kotas from "./pages/kotas/Kotas";
import Kecamatans from "./pages/kecamatans/Kecamatans";
import Kelurahans from "./pages/kelurahans/Kelurahans";
import LoginLogs from "./pages/login-logs/LoginLogs";
import UsersPage from "./pages/users/Users";
import Roles from "./pages/roles/Roles";
import ActivityLogs from "./pages/activity-logs/ActivityLogs";
import Jabatans from "./pages/jabatans/Jabatans";
import Anggotas from "./pages/anggotas/Anggotas";
import DocumentSpecifications from "./pages/document-specifications/DocumentSpecifications";
import UserDevices from "./pages/user-devices/UserDevices";
import BlockedIps from "./pages/block-ip/BlockedIps";
import RWs from "./pages/rws/RWs";
import ProgramThemes from "./pages/master/ProgramThemes";
import ProgramFields from "./pages/program-fields/ProgramFields";
import ProgramTargets from "./pages/program-targets/ProgramTargets";
import ProgramGoals from "./pages/program-goals/ProgramGoals";
import WorkPrograms from "./pages/work-programs/WorkPrograms";
import Activities from "./pages/activities/Activities";
import Attendance from "./pages/activities/Attendance";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <ModalProvider>
            <AuthProvider>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* ============================================ */}
                {/* 1. DASHBOARD - Semua role yang sudah login */}
                {/* ============================================ */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 2. MANAJEMEN USER - Super Admin & Admin PC */}
                {/* ============================================ */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <UsersPage />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 3. MANAJEMEN ORGANISASI - Semua role */}
                {/* ============================================ */}
                <Route
                  path="/organizations"
                  element={
                    <ProtectedRoute>
                      <Organizations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/create"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator"]}
                        allowedLevels={["pc"]}
                      >
                        <OrganizationForm />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/:id"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <OrganizationDetail />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/:id/edit"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <OrganizationForm />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 4. MANAJEMEN ANGGOTA - Semua role */}
                {/* ============================================ */}
                <Route
                  path="/anggotas"
                  element={
                    <ProtectedRoute>
                      <Anggotas />
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 5. PROGRAM KERJA PC - Super Admin, Admin, Operator, Anggota PC */}
                {/* ============================================ */}
                <Route
                  path="/program-themes"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc"]}
                      >
                        <ProgramThemes />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/program-fields"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc"]}
                      >
                        <ProgramFields />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/program-targets"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc"]}
                      >
                        <ProgramTargets />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/program-goals"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc"]}
                      >
                        <ProgramGoals />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 6. PROGRAM KERJA MWC - Semua role kecuali Lembaga & Banom */}
                {/* ============================================ */}
                <Route
                  path="/work-programs-mwc"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc", "mwc", "ranting", "anak-ranting"]}
                      >
                        <WorkPrograms />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 7. KEGIATAN PROKER - Semua role kecuali Lembaga & Banom */}
                {/* ============================================ */}
                <Route
                  path="/activity-prokers"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator", "anggota"]}
                        allowedLevels={["pc", "mwc", "ranting", "anak-ranting"]}
                      >
                        <Activities />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 8. ABSENSI KEGIATAN - Super Admin, Admin, Operator (PC, MWC, Ranting) */}
                {/* ============================================ */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator"]}
                        allowedLevels={["pc", "mwc", "ranting"]}
                      >
                        <Attendance />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/attendance/:id"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator"]}
                        allowedLevels={["pc", "mwc", "ranting"]}
                      >
                        <Attendance />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 9. MASTER DATA - Super Admin & Admin PC */}
                {/* ============================================ */}
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Roles />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jabatans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Jabatans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/document-specifications"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <DocumentSpecifications />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization-levels"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <OrganizationLevels />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization-types"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <OrganizationTypes />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 10. DATA WILAYAH - Super Admin & Admin PC */}
                {/* ============================================ */}
                <Route
                  path="/kotas"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Kotas />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kecamatans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Kecamatans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kelurahans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Kelurahans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rws"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <RWs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* ============================================ */}
                {/* 11. LOG AKTIVITAS - Super Admin & Admin PC */}
                {/* ============================================ */}
                <Route
                  path="/login-logs"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <LoginLogs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity-logs"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <ActivityLogs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-devices"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <UserDevices />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blocked-ips"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <BlockedIps />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Default redirect */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* 404 - Page Not Found */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </AuthProvider>
          </ModalProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;