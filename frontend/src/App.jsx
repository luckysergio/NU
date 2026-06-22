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

                {/* Dashboard - Semua role yang sudah login bisa akses */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* User Management - Super Admin atau Admin dengan level PC */}
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

                <Route
                  path="/program-themes"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
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
                        allowedRoles={["super-admin", "admin"]}
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
                        allowedRoles={["super-admin", "admin"]}
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
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <ProgramGoals />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Role Management - Hanya Super Admin */}
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <Roles />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Jabatan Management - Hanya Super Admin */}
                <Route
                  path="/jabatans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <Jabatans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Anggota Management - Super Admin, Admin, Operator */}
                <Route
                  path="/anggotas"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin", "operator"]}
                      >
                        <Anggotas />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Organization Management - Super Admin atau Admin dengan level PC */}
                <Route
                  path="/organizations"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc"]}
                      >
                        <Organizations />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/create"
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

                {/* Organization Levels - Hanya Super Admin */}
                <Route
                  path="/organization-levels"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <OrganizationLevels />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Organization Types - Hanya Super Admin */}
                <Route
                  path="/organization-types"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <OrganizationTypes />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Kota Management - Hanya Super Admin */}
                <Route
                  path="/kotas"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <Kotas />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Kecamatan Management - Hanya Super Admin */}
                <Route
                  path="/kecamatans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <Kecamatans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Kelurahan Management - Hanya Super Admin */}
                <Route
                  path="/kelurahans"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <Kelurahans />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/rws"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <RWs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Login Logs - Hanya Super Admin */}
                <Route
                  path="/login-logs"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <LoginLogs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Activity Logs - Hanya Super Admin */}
                <Route
                  path="/activity-logs"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <ActivityLogs />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/user-devices"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <UserDevices />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/blocked-ips"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <BlockedIps />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Document Specifications - Hanya Super Admin */}
                <Route
                  path="/document-specifications"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute allowedRoles={["super-admin"]}>
                        <DocumentSpecifications />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/work-programs-mwc"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin"]}
                        allowedLevels={["pc", "mwc", "ranting"]}
                      >
                        <WorkPrograms />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/activity-prokers"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRoute
                        allowedRoles={["super-admin", "admin","operator","anggota"]}
                        allowedLevels={["pc", "mwc", "ranting"]}
                      >
                        <Activities />
                      </RoleBasedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/attendance/:id" // ← Menambahkan parameter :id
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
