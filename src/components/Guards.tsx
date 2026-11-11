import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isMember, useAuth } from '../lib/auth';

export function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <img src="/logo.png" alt="" width={64} height={64} />
      <span>Caricamento…</span>
    </div>
  );
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/accedi" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireMember({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/accedi" replace state={{ from: location.pathname }} />;
  if (!profile) return <Splash />;
  if (!isMember(profile)) return <Navigate to="/attesa" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/accedi" replace />;
  if (!profile) return <Splash />;
  if (!profile.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
