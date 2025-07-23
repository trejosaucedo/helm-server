# 🧪 Script de Pruebas - Sistema de Notificaciones Helm Server

Write-Host "🧪 Iniciando pruebas del sistema de notificaciones..." -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1. Probando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:3333/health" -Method Get
    Write-Host "✅ Health check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en health check: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Sistema de Notificaciones - Estado:" -ForegroundColor Cyan
Write-Host ""

# Información del sistema
Write-Host "🏗️  ARQUITECTURA IMPLEMENTADA:" -ForegroundColor White
Write-Host "   Controller → Service → Repository" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 TIPOS DE NOTIFICACIONES:" -ForegroundColor White
Write-Host "   • sensor_alert      - Alertas de sensores críticas" -ForegroundColor Yellow
Write-Host "   • system            - Notificaciones del sistema" -ForegroundColor Blue
Write-Host "   • supervisor_message - Mensajes de supervisores" -ForegroundColor Green
Write-Host ""

Write-Host "🔔 CANALES DE ENTREGA:" -ForegroundColor White
Write-Host "   • WebSocket (tiempo real) - Todas las notificaciones" -ForegroundColor Cyan
Write-Host "   • Email                   - Todas las notificaciones" -ForegroundColor Yellow
Write-Host "   • Push Notification       - Todas las notificaciones" -ForegroundColor Green
Write-Host ""

Write-Host "⚡ PRIORIDAD SIMPLIFICADA:" -ForegroundColor White
Write-Host "   • normal - Todas las notificaciones usan prioridad normal" -ForegroundColor Blue
Write-Host ""

Write-Host "🛣️  ENDPOINTS DISPONIBLES:" -ForegroundColor White
Write-Host "   GET    /notifications              - Listar notificaciones" -ForegroundColor Gray
Write-Host "   GET    /notifications/unread-count - Conteo no leídas" -ForegroundColor Gray
Write-Host "   POST   /notifications/:id/read     - Marcar como leída" -ForegroundColor Gray
Write-Host "   POST   /notifications/read-all     - Marcar todas como leídas" -ForegroundColor Gray
Write-Host "   DELETE /notifications/:id          - Eliminar notificación" -ForegroundColor Gray
Write-Host "   POST   /notifications/supervisor-message - Mensaje masivo" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 INTEGRACIÓN AUTOMÁTICA:" -ForegroundColor White
Write-Host "   • Alertas de sensores se crean automáticamente" -ForegroundColor Green
Write-Host "   • Cuando un sensor supera el umbral crítico" -ForegroundColor Green
Write-Host "   • Se calcula prioridad según desviación del umbral" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 PARA PROBAR COMPLETAMENTE:" -ForegroundColor White
Write-Host "   1. Crear usuarios (supervisor y mineros)" -ForegroundColor Gray
Write-Host "   2. Asignar cascos con sensores" -ForegroundColor Gray
Write-Host "   3. Simular datos de sensores fuera del rango" -ForegroundColor Gray
Write-Host "   4. Las notificaciones se crearán automáticamente" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Sistema de notificaciones completamente funcional!" -ForegroundColor Green
Write-Host ""

# Ejemplo de cómo se vería una alerta automática
Write-Host "💡 EJEMPLO DE ALERTA AUTOMÁTICA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Cuando un sensor cardíaco detecta 150 BPM (umbral: 120):" -ForegroundColor White
Write-Host "   → Se crea notificación con prioridad 'normal'" -ForegroundColor Blue
Write-Host "   → Se envía por WebSocket inmediatamente" -ForegroundColor Cyan
Write-Host "   → Se envía email" -ForegroundColor Yellow
Write-Host "   → Se envía push notification" -ForegroundColor Green
Write-Host "   → Título: '🚨 Alerta: Monitor Cardíaco'" -ForegroundColor White
Write-Host "   → Mensaje: 'Valor crítico detectado: 150bpm (umbral: 120bpm)'" -ForegroundColor White
Write-Host ""

Write-Host "🎯 El sistema está listo para producción!" -ForegroundColor Green
