import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUserRole } from "../slice/authSlice";

export default function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
