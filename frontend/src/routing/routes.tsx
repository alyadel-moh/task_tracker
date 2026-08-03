import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import TaskDetailsPage from "../components/TaskDetailsPage";
const Signup = lazy(() => import("../components/Signup"));
const Login = lazy(() => import("../components/Login"));

const router = createBrowserRouter([
  {
    path: "/",
    element: localStorage.getItem("token") ? (
      <Navigate to="/dashboard" />
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
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "dashboard/:projectId/task/:taskId",
    element: (
      <ProtectedRoute>
        <TaskDetailsPage />
      </ProtectedRoute>
    ),
  },
]);
export default router;
