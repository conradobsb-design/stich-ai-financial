import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages — cada uma vira chunk separado no build
const Home                 = lazy(() => import('./pages/Home'));
const Login                = lazy(() => import('./pages/Login'));
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const InvitePage           = lazy(() => import('./pages/InvitePage'));
const ResetPassword        = lazy(() => import('./pages/ResetPassword'));
const TermosDeUso          = lazy(() => import('./pages/TermosDeUso'));
const PoliticaDePrivacidade = lazy(() => import('./pages/PoliticaDePrivacidade'));
const FAQ                  = lazy(() => import('./pages/FAQ'));
const Pricing              = lazy(() => import('./pages/Pricing'));
const Onboarding           = lazy(() => import('./pages/Onboarding'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#020617',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid rgba(14,165,233,0.2)',
        borderTopColor: '#0ea5e9',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/termos-de-uso"            element={<TermosDeUso />} />
          <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/faq"            element={<FAQ />} />
          <Route path="/pricing"        element={<Pricing />} />
          <Route path="/onboarding"     element={<Onboarding />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/invite"
            element={<ProtectedRoute><InvitePage /></ProtectedRoute>}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
