import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("auth_token");
  const userRaw = localStorage.getItem("auth_user");
  const location = useLocation();

  if (!token || !userRaw) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;