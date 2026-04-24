import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getAuthToken } from '../utils/auth';

export default function ProtectedRoute() {
  const location = useLocation();
  const token = getAuthToken();

  if (!token) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
  }

  return <Outlet />;
}

