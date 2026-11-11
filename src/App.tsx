import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { PublicOnly, RequireAdmin, RequireAuth, RequireMember } from './components/Guards';
import { AuthProvider } from './lib/auth';
import Admin from './pages/Admin';
import Course from './pages/Course';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import { Privacy, Terms } from './pages/Legal';
import Login from './pages/Login';
import Pending from './pages/Pending';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

function LegacyLesson() {
  const { id } = useParams();
  return <Navigate to={`/corso/${id ?? ''}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/accedi" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/registrati" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/password-dimenticata" element={<ForgotPassword />} />
          <Route path="/nuova-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/termini" element={<Terms />} />
          <Route path="/attesa" element={<RequireAuth><Pending /></RequireAuth>} />
          <Route path="/" element={<RequireMember><Home /></RequireMember>} />
          <Route path="/corso" element={<RequireMember><Course /></RequireMember>} />
          <Route path="/corso/:id" element={<RequireMember><Course /></RequireMember>} />
          <Route path="/lezione/:id" element={<LegacyLesson />} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
