# Guía de Deployment a VPS

## 🖥️ Servidor Destino

```
IP: 185.97.144.72
Dominio: fullstackai.cliender.com
Usuario: root
SSH Key: ~/.ssh/fullstackai_deploy
```

## 📋 Checklist Pre-Deployment

- [ ] Código testeado localmente
- [ ] Build frontend compilado
- [ ] Variables .env configuradas
- [ ] PostgreSQL accesible
- [ ] PM2 instalado en VPS
- [ ] Nginx configurado

## 🚀 Pasos de Deployment

### 1. Sincronizar código
```bash
rsync -avz --delete \
  apps/studio/ \
  apps/leadup/ \
  infrastructure/ \
  package.json \
  root@185.97.144.72:/var/www/fullstackai/
```

### 2. Instalar dependencias
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 << 'SSH'
cd /var/www/fullstackai
npm install
cd apps/studio && npm install
cd ../leadup && npm install --legacy-peer-deps
SSH
```

### 3. Compilar frontend
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 << 'SSH'
cd /var/www/fullstackai/apps/studio
npm run build
cd ../leadup
npm run build
SSH
```

### 4. Configurar ambiente
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 << 'SSH'
cat > /var/www/fullstackai/.env << 'ENV'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cliender
DB_USER=postgres
DB_PASSWORD=<tu_password>
JWT_SECRET=<tu_secret_jwt>
PORT_STUDIO=3001
NODE_ENV=production
ENV
SSH
```

### 5. Restart servicios
```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 << 'SSH'
pm2 restart fullstackai-app
pm2 save
SSH
```

### 6. Verificar
```bash
curl https://fullstackai.cliender.com
curl https://fullstackai.cliender.com/api/health
```

## 🔄 Rollback en caso de error

```bash
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 << 'SSH'
pm2 restart fullstackai-app
pm2 logs fullstackai-app
SSH
```

## 📊 Monitoreo

```bash
# Ver logs en vivo
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  "pm2 logs fullstackai-app"

# Ver estado
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  "pm2 status"

# Ver detalles
ssh -i ~/.ssh/fullstackai_deploy root@185.97.144.72 \
  "pm2 show fullstackai-app"
```

## 🔐 Notas de Seguridad

1. Nunca commitear .env con secretos reales
2. Usar SSH key en lugar de contraseña
3. Verificar SSL/TLS antes de deployment
4. Mantener backups de PostgreSQL
5. Monitorear logs regularmente

