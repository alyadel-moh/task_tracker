import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
const Signup = lazy(() => import("../components/Signup"));
const Login = lazy(() => import("../components/Login"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
]);
export default router;
