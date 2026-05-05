# Guía de Contribución

## 📝 Convenciones de Código

### Commits
```
<type>: <descripción breve>

<descripción detallada>

<footer>
```

Tipos:
- `feat:` Nueva funcionalidad
- `fix:` Arreglo de bug
- `refactor:` Cambio de código sin alterar funcionalidad
- `docs:` Documentación
- `test:` Tests
- `chore:` Cambios de configuración/dependencias

Ejemplo:
```
feat: Agregar seed de estilos fotográficos predefinidos

- 4 estilos iniciales para Studio
- Seeding automático al iniciar DB
- Validación de duplicados

Fixes #42
```

### Ramas
```
feature/descripcion-feature
bugfix/descripcion-bug
refactor/descripcion-refactor
docs/descripcion-doc
```

### Código

#### JavaScript/TypeScript
```javascript
// ✅ Bien
const getUserData = (userId) => {
  return db.query('SELECT * FROM users WHERE id = $1', [userId]);
};

// ❌ Mal
var getUserData=function(id){
  return db.query("SELECT * FROM users WHERE id = ?",id);
};
```

#### Funciones asincrónicas
```javascript
// ✅ Usar async/await
async function fetchClients() {
  try {
    const result = await pool.query('SELECT * FROM clients');
    return result.rows;
  } catch (error) {
    logger.error('Error fetching clients', error);
    throw error;
  }
}

// ❌ Callbacks antiguos
db.prepare('SELECT * FROM clients').all((err, rows) => {
  // ...
});
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## ✅ Checklist antes de PR

- [ ] Código sigue convenciones del proyecto
- [ ] Tests pasan localmente
- [ ] No hay console.log en código
- [ ] Documentación actualizada
- [ ] Commit message descriptivo
- [ ] Sin dependencias no necesarias

