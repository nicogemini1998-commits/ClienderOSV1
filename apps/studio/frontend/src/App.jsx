import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SpacesScreen } from './pages/SpacesScreen.jsx';
import { OrchestratorCanvas } from './canvas/OrchestratorCanvas.jsx';
import { ContentStudioCanvas } from './canvas/studio/ContentStudioCanvas.jsx';

const ADMIN_ROLES = ['admin'];

function AppInner() {
  const { user, loading } = useAuth();
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const [tool, setTool] = useState(() => isAdmin ? 'orchestrator' : 'studio');
  // null = spaces screen, string id = open that template, 'new' = blank canvas
  const [openSpaceId, setOpenSpaceId] = useState(null);
  const [openSpaceName, setOpenSpaceName] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

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

  // Orchestrator tool (admins only)
  if (tool === 'orchestrator') {
    return (
      <OrchestratorCanvas
        onSwitchTool={() => { setTool('studio'); setOpenSpaceId(null); }}
      />
    );
  }

  // Studio: show spaces screen unless a space is open
  if (!openSpaceId) {
    return (
      <SpacesScreen
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        onOpenCanvas={() => setOpenSpaceId('new')}
        onOpenSpace={(id, name) => { setOpenSpaceId(id); setOpenSpaceName(name); }}
      />
    );
  }

  return (
    <ContentStudioCanvas
      selectedClient={selectedClient}
      onSelectClient={setSelectedClient}
      initialTemplateId={openSpaceId !== 'new' ? openSpaceId : null}
      spaceName={openSpaceName || 'Nuevo espacio'}
      onBack={() => { setOpenSpaceId(null); setOpenSpaceName(''); }}
      onSwitchTool={isAdmin ? () => setTool('orchestrator') : null}
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
