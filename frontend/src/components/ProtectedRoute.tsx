import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useGetUser from "../hooks/meHook";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const { isError } = useGetUser();

  if (!token || isError) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
