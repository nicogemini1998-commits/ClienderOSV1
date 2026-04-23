# 📅 MARTES — Plan de Implementación

**Fecha:** 2026-04-25  
**Objetivo:** Sistema operativo con agentes ejecutándose en real-time  
**Estado:** Código listo, solo falta integrar

---

## 🎯 Qué vamos a hacer HOY

### **Morning (2-3 horas)**
```
1. Setup proyecto (npm install)
2. Conectar BOB-BRAIN con FullStackAI backend
3. Crear rutas Express para agentes
4. Implementar Socket.io
```

### **Midday (2-3 horas)**
```
5. Integrar frontend Dashboard
6. Canvas visual con agentes
7. Real-time updates
```

### **Afternoon (1-2 horas)**
```
8. Testing completo
9. Debugging
10. Documentación de ejecución
```

---

## 📥 PASO 1: Setup Proyecto

### **1a. Descargar repo GitHub**
```bash
git clone https://github.com/nicogemini1998-commits/CLIENDER-OS.git
cd CLIENDER-OS
```

### **1b. Instalar dependencias**
```bash
# Monorepo setup
npm install

# O instalar por workspace
npm install --workspace=BOB-BRAIN
npm install --workspace=FullStackAI/backend
npm install --workspace=FullStackAI/frontend
```

### **1c. Configurar .env**
```bash
# Copiar template
cp SHARED/.env.example .env

# Editar con:
DATABASE_URL=postgresql://fai_user:fai_db_2024_secure@127.0.0.1:5432/cliender_os
ANTHROPIC_API_KEY=sk-ant-... (tu key)
JWT_SECRET=tu-secret-2024
PORT_FULLSTACK=3005
FRONTEND_URL=http://localhost:5173
```

---

## 🧠 PASO 2: Verificar BOB-BRAIN

### **2a. Test agentes localmente**
```bash
cd BOB-BRAIN

# Crear test-agents.js
node -e "
import('./agentes/index.js').then(async (m) => {
  const result = await m.executeWorkflow({
    name: 'Test Company',
    website: 'https://example.com',
    sector: 'Technology'
  });
  console.log(JSON.stringify(result, null, 2));
})
"
```

### **2b. Verificar memoria compartida**
```bash
# Debería ver:
# 1️⃣ LeadExtractor iniciando
# 📝 LeadExtractor escribió en notebook
# 2️⃣ PainAnalyzer iniciando
# ... (etc)
# ✅ WORKFLOW COMPLETADO (5 pasos)
```

---

## 🚀 PASO 3: Backend Express

### **3a. Archivos creados**
```
FullStackAI/backend/
├── server.js          ← Ya está creado
├── routes/
│   └── agents.js      ← Crear (ver abajo)
└── middleware/
    └── auth.js        ← Crear
```

### **3b. Crear routes/agents.js**
```javascript
// Ya incluido en server.js, solo verifica que:
// 1. POST /api/agents/execute-workflow esté disponible
// 2. Socket.io emita eventos correctos
// 3. Logging sea visible
```

### **3c. Iniciar backend**
```bash
cd FullStackAI/backend
npm install
npm run dev

# Debería ver:
# ✅ FullStackAI Backend iniciado en puerto 3005
# 📍 HTTP: http://localhost:3005
# 🔌 WebSocket: ws://localhost:3005
```

---

## 🎨 PASO 4: Frontend React

### **4a. Archivos creados**
```
FullStackAI/frontend/
├── src/
│   ├── pages/
│   │   └── Dashboard.jsx  ← Ya está creado
│   ├── components/
│   │   └── (10 componentes)
│   ├── App.jsx
│   └── index.css
└── vite.config.js
```

### **4b. Actualizar App.jsx**
```jsx
import Dashboard from './pages/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;
```

### **4c. Instalar dependencias frontend**
```bash
cd FullStackAI/frontend
npm install
npm install socket.io-client

# Copia componentes si no están
cp ../../COMPONENTES_REACT_ELEGANTES.jsx src/components/index.jsx
cp ../../CLIENDER_DESIGN_SYSTEM.css src/index.css
```

### **4d. Iniciar frontend**
```bash
npm run dev

# Debería ver:
# ➜ Local: http://localhost:5173/
```

---

## 🔌 PASO 5: Conectar Frontend + Backend

### **5a. Verificar Socket.io**
```jsx
// En Dashboard.jsx ya está implementado:
const socket = io('http://localhost:3005');

socket.on('workflow:success', (result) => {
  setWorkflowResult(result);
});

socket.emit('workflow:request', formData);
```

### **5b. Test en navegador**
```
1. Abrir http://localhost:5173
2. Llenar formulario:
   - Nombre: "Test Company"
   - Website: "https://test.com"
   - Sector: "Technology"
3. Click "Ejecutar Workflow"
4. Ver agentes ejecutándose en cadena
5. Resultado en 10-15 segundos
```

---

## ✅ PASO 6: Testing Completo

### **Test 1: Backend directo**
```bash
# Terminal 1: Backend ejecutándose

# Terminal 2: Hacer request
curl -X POST http://localhost:3005/api/agents/execute-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Company",
    "website":"https://test.com",
    "sector":"Technology"
  }'

# Debería retornar JSON con propuesta completa
```

### **Test 2: Frontend → Backend**
```
1. Abrir Developer Tools (F12)
2. Ver Network tab
3. Ejecutar workflow desde Dashboard
4. Verificar:
   - Socket.io conecta ✓
   - Agentes se ejecutan ✓
   - Resultado aparece ✓
```

### **Test 3: Memoria compartida**
```bash
# En server.js, verificar logs:
📓 SharedNotebook inicializado
📝 LeadExtractor escribió en notebook [seq: 1]
📝 PainAnalyzer escribió en notebook [seq: 2]
📝 StrategyMapper escribió en notebook [seq: 3]
... (etc)
```

---

## 🐛 Debugging

### **Si Backend no conecta:**
```
1. Verificar puerto 3005 libre:
   lsof -i :3005
   
2. Verificar CORS en server.js:
   const io = new SocketServer(httpServer, {
     cors: { origin: 'http://localhost:5173' }
   });
   
3. Verificar .env FRONTEND_URL
```

### **Si Agentes fallan:**
```
1. Verificar ANTHROPIC_API_KEY en .env
2. Ejecutar test local:
   node BOB-BRAIN/test-agents.js
3. Ver logs de SharedNotebook
```

### **Si Socket.io no actualiza UI:**
```
1. Verificar socket.io-client instalado
2. Revisar eventos en Dashboard.jsx:
   socket.on('workflow:success', ...)
   socket.emit('workflow:request', ...)
3. Browser Console (F12) para errores
```

---

## 📊 Workflow Completo (Lo que verá el usuario)

```
USUARIO:
1. Llenar formulario (nombre, website, sector)
2. Click "Ejecutar Workflow"

BACKEND:
3. Recibe request en /api/agents/execute-workflow
4. Llama a executeWorkflow(data)
5. Ejecuta 5 agentes en cadena:
   - LeadExtractor (400 tokens)
   - PainAnalyzer (600 tokens)
   - StrategyMapper (700 tokens)
   - ProposalWriter (900 tokens)
   - NextStepsPlanner (500 tokens)
6. Escribe en SharedNotebook (memoria única)
7. Retorna resultado completo

FRONTEND:
8. Socket.io recibe workflow:success
9. Actualiza UI con propuesta
10. Muestra resultado final

TIEMPO: ~10-15 segundos (Haiku es rápido)
COSTO: ~$0.0003 por ejecución
```

---

## 📝 Checklist MARTES

### **Morning**
- [ ] Git clone + npm install
- [ ] .env configurado
- [ ] BOB-BRAIN agentes funcionan localmente
- [ ] Backend inicia sin errores

### **Midday**
- [ ] Frontend inicia (localhost:5173)
- [ ] Socket.io conecta
- [ ] Dashboard visible
- [ ] Componentes React cargan

### **Afternoon**
- [ ] Test end-to-end (form → propuesta)
- [ ] Todos los agentes ejecutan
- [ ] Memoria compartida funciona
- [ ] UI actualiza en tiempo real

### **Final**
- [ ] Todo documentado
- [ ] Listo para MIÉRCOLES

---

## 🎯 URLs de desarrollo

```
Backend:    http://localhost:3005
Frontend:   http://localhost:5173
WebSocket:  ws://localhost:3005

Health Check:
curl http://localhost:3005/api/health
```

---

## 📚 Archivos MARTES

```
FullStackAI/backend/server.js       ✅ (Creado)
FullStackAI/frontend/src/pages/Dashboard.jsx  ✅ (Creado)
FullStackAI/frontend/src/App.jsx    ← Actualizar
BOB-BRAIN/agentes/index.js          ✅ (Listo)
.env                                ← Crear/Editar
```

---

## ✨ Success Criteria

```
✅ Backend escucha en puerto 3005
✅ Frontend visible en navegador
✅ Socket.io conecta sin errores
✅ Puedo enviar lead desde formulario
✅ 5 agentes se ejecutan en cadena
✅ Propuesta aparece en 10-15 segundos
✅ Memoria compartida sin repeticiones
✅ UI actualiza en tiempo real
```

---

## 🚀 Si todo funciona

**Resultado:**
- ✅ Sistema operativo
- ✅ Agentes ejecutándose
- ✅ Real-time updates
- ✅ Propuestas generadas automáticamente

**Próximo:** MIÉRCOLES → ContentStudio + LeadUp

---

**¡MARTES ESTÁ LISTO!** 

*Solo necesitas ejecutar:*
```bash
npm install
npm run dev  # En ambas carpetas
# Y listo... ¡Sistema operativo!
```

---

*MARTES Plan | 2026-04-25 | Nicolas + Claude*
