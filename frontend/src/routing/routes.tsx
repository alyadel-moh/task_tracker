import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import { ProjectManagementPage } from "../components/ProjectManagementPage";
const ProtectedRoute = lazy(() => import("../components/ProtectedRoute"));
const TaskDetailsPage = lazy(() => import("../components/TaskDetailsPage"));
const Signup = lazy(() => import("../components/Signup"));
const Login = lazy(() => import("../components/Login"));

const router = createBrowserRouter([
  {
    path: "/",
    element: localStorage.getItem("token") ? (
      <Navigate to="/projects" />
    ) : (
      <Navigate to="/login" />
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicOnlyRoute>
        <Signup />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:projectId/task/:taskId",
    element: (
      <ProtectedRoute>
        <TaskDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:projectId/memberships",
    element: (
      <ProtectedRoute>
        <ProjectManagementPage />
      </ProtectedRoute>
    ),
  },
]);
export default router;
