import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/landing page';
import Dashboard from './components/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: any) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;