import { Navigate, useLocation } from "react-router-dom";

function RoleRoute({ allowedRoles = [], children }) {
  const userRaw = localStorage.getItem("auth_user");
  const token = localStorage.getItem("auth_token");
  const location = useLocation();

  if (!token || !userRaw) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  let user = null;

  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleRoute;