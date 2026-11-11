import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAdmin, RequireAuth, RequireMember } from './components/Guards';
import { AuthProvider } from './lib/auth';
import Admin from './pages/Admin';
import Courses from './pages/Courses';
import ForgotPassword from './pages/ForgotPassword';
import Lesson from './pages/Lesson';
import Login from './pages/Login';
import Pending from './pages/Pending';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/accedi" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/registrati" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/password-dimenticata" element={<ForgotPassword />} />
          <Route path="/nuova-password" element={<ResetPassword />} />
          <Route path="/attesa" element={<RequireAuth><Pending /></RequireAuth>} />
          <Route path="/" element={<RequireMember><Courses /></RequireMember>} />
          <Route path="/lezione/:id" element={<RequireMember><Lesson /></RequireMember>} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
