# LeadUp — Deploy a producción (leadup.cliender.com)

> Fuente de verdad ÚNICA (canónico): este repo `~/ClienderOSV1/apps/leadup`.
> SSH: alias `fullstackai-vps` (root). Verificado 2026-07-14.

## Arquitectura real
- **Frontend**: lo sirve **nginx del HOST** desde `root /var/www/leadup/frontend/dist`
  (config `/etc/nginx/sites-enabled/leadup.cliender.com`). El container `leadup-frontend`
  NO está en la ruta de servicio (inert). `docker cp` al container NO cambia nada.
- **Backend**: container `leadup-backend` (código baked). nginx `location /api/ -> 127.0.0.1:8002`.
- DB: Postgres (asyncpg) con wrapper aiosqlite-like en `backend/database.py` (traduce `?`->`$N`).

## Deploy FRONTEND
```bash
cd apps/leadup/frontend && npm run build
ssh fullstackai-vps 'cp -a /var/www/leadup/frontend/dist /var/www/leadup/frontend/dist.bak-$(date +%Y%m%d-%H%M)'
rsync -az --delete dist/ fullstackai-vps:/var/www/leadup/frontend/dist/
ssh fullstackai-vps 'chown -R www-data:www-data /var/www/leadup/frontend/dist \
  && find /var/www/leadup/frontend/dist -type d -exec chmod 755 {} \; \
  && find /var/www/leadup/frontend/dist -type f -exec chmod 644 {} \;'
# Sin chown -> nginx (www-data) devuelve HTTP 403.
```

## Deploy BACKEND (hot-patch 1-3 archivos)
```bash
scp apps/leadup/backend/routers/admin.py fullstackai-vps:/tmp/
ssh fullstackai-vps 'docker cp /tmp/admin.py leadup-backend:/app/routers/admin.py \
  && docker exec leadup-backend find /app/routers/__pycache__ -name "admin*.pyc" -delete \
  && docker restart leadup-backend'
```

## Verificación
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://leadup.cliender.com/health          # 200
curl -s https://leadup.cliender.com/ | grep -o "index-[A-Za-z0-9]*\.js"              # bundle nuevo
```

## Gotchas
- asyncpg: NO castear el placeholder (`?::date` falla). Usar `to_char(col,'YYYY-MM-DD') >= ?`.
- motion: usar `import { motion }`, nunca `m as motion` (no hay LazyMotion -> no anima).
- rename-niche: feature en rama `wip/rename-niche`, NO desplegada.
