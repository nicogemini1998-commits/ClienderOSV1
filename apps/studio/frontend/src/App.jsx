import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { OrchestratorCanvas } from './canvas/OrchestratorCanvas.jsx';
import { ContentStudioCanvas } from './canvas/studio/ContentStudioCanvas.jsx';

const ADMIN_ROLES = ['admin'];

function AppInner() {
  const { user, loading } = useAuth();
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  // Admins start at orchestrator, limited users go straight to studio
  const [tool, setTool] = useState(() => isAdmin ? 'orchestrator' : 'studio');

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: 'oklch(11% 0.015 250)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'oklch(35% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
          cargando...
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Limited users: only Studio, no access to Orchestrator
  if (!isAdmin) {
    return <ContentStudioCanvas />;
  }

  // Admins: can switch between tools
  if (tool === 'studio') {
    return (
      <ContentStudioCanvas
        onSwitchTool={() => setTool('orchestrator')}
      />
    );
  }

  return (
    <OrchestratorCanvas
      onSwitchTool={() => setTool('studio')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
