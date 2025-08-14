# 🚀 Guía de Despliegue en AWS EC2

## 📋 Pasos para el Despliegue

### 1️⃣ En tu servidor EC2:

```bash
# Clonar el repositorio (primera vez)
git clone https://github.com/trejosaucedo/helm-server.git
cd helm-server

# O actualizar si ya existe
git pull origin main
```

### 2️⃣ Instalar dependencias:

```bash
npm install
```

### 3️⃣ Configurar variables de entorno:

```bash
cp .env.example .env
nano .env  # Editar con tus configuraciones
```

**Configuraciones importantes en .env:**
```env
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
DB_CONNECTION=mysql
# Configurar tu base de datos, MongoDB, Redis, etc.
```

### 4️⃣ Preparar base de datos:

```bash
node ace migration:run
```

### 5️⃣ Compilar y ejecutar:

```bash
# Compilar para producción
npm run build

# Opción 1: Ejecutar directamente
npm start

# Opción 2: Con PM2 (recomendado)
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🛡️ Configuración de Seguridad

### Security Groups en AWS:
- **Puerto 3333**: HTTP (tu API)
- **Puerto 443**: HTTPS (recomendado con certificado SSL)
- **Puerto 22**: SSH (para administración)

### Firewall interno (opcional):
```bash
sudo ufw allow 3333
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 📊 Endpoints Disponibles

### 🆕 **Endpoint Batch (Nuevo)**
```
POST /cascos/:cascoId/sensores/batch
```

**Ejemplo de uso:**
```javascript
const response = await fetch(`${API_URL}/cascos/${cascoId}/sensores/batch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sensores: [
      {
        sensorLocalId: "TMP",
        valor: 36.8,
        unidad: "°C"
      },
      {
        sensorLocalId: "MQ7", 
        valor: 45,
        unidad: "ppm"
      }
    ]
  })
});
```

## 🔍 Verificación del Despliegue

```bash
# Verificar que el servidor esté corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs helm-server

# Verificar conectividad
curl http://localhost:3333/health  # Si tienes endpoint de health
```

## 🔄 Comandos Útiles

```bash
# Reiniciar servidor
pm2 restart helm-server

# Parar servidor
pm2 stop helm-server

# Ver logs
pm2 logs --lines 100

# Actualizar desde GitHub
git pull origin main
npm install
npm run build
pm2 restart helm-server
```

## ✅ Estado Actual

- ✅ **Endpoint batch**: Implementado y probado
- ✅ **Rutas optimizadas**: Orden correcto
- ✅ **Código limpio**: Sin archivos de test
- ✅ **Documentación**: Completa y actualizada
- ✅ **Listo para producción**: 100%

---

**¡Tu backend está listo para funcionar en AWS EC2!** 🎉
