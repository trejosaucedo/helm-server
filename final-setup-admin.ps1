# Script final para cambiar contraseña y probar funcionalidad
Write-Host "🔧 Preparando cambio de contraseña para admin..." -ForegroundColor Green

$email = "admin@helmmining.com"
$newPassword = "123456789"

# Crear SQL para cambiar contraseña (texto plano temporal para testing)
$sqlContent = @"
-- TEMPORAL: Cambiar a contraseña en texto plano para testing
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

UPDATE users SET password = '$newPassword' WHERE email = '$email';

-- Verificar el cambio
SELECT id, email, role, password FROM users WHERE email = '$email';

-- Mostrar info del usuario
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM users 
WHERE email = '$email';
"@

Set-Content -Path "change-admin-password.sql" -Value $sqlContent -Encoding UTF8

Write-Host "✅ SQL creado: change-admin-password.sql" -ForegroundColor Green

Write-Host "`n📋 PASOS PARA CONTINUAR:" -ForegroundColor Yellow
Write-Host "1. Ejecuta en MySQL:" -ForegroundColor White
Write-Host "   mysql -u root -p helm < change-admin-password.sql" -ForegroundColor Gray

Write-Host "`n2. Luego ejecuta el test completo:" -ForegroundColor White
Write-Host "   .\test-create-casco-with-sensors.ps1" -ForegroundColor Gray

Write-Host "`n🎯 CREDENCIALES DESPUÉS DEL CAMBIO:" -ForegroundColor Green
Write-Host "Email: $email" -ForegroundColor Cyan
Write-Host "Password: $newPassword" -ForegroundColor Cyan
Write-Host "Role: admin (existente)" -ForegroundColor Cyan

Write-Host "`n⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "Esta contraseña está en texto plano para testing." -ForegroundColor Yellow
Write-Host "En producción deberías usar el hash apropiado." -ForegroundColor Yellow

Write-Host "`n🚀 DESPUÉS DEL TEST, LA FUNCIONALIDAD DEBERÍA:" -ForegroundColor Green
Write-Host "✅ Hacer login exitoso con el admin" -ForegroundColor White
Write-Host "✅ Crear un casco nuevo" -ForegroundColor White
Write-Host "✅ Crear automáticamente 4 sensores:" -ForegroundColor White
Write-Host "   • GPS Tracker (coords, 5s)" -ForegroundColor Gray
Write-Host "   • Monitor de Ritmo Cardíaco (bpm, 10s, alert: 130)" -ForegroundColor Gray
Write-Host "   • Sensor de Temperatura Corporal (°C, 15s, alert: 38.5)" -ForegroundColor Gray
Write-Host "   • Detector de Gas (ppm, 3s, alert: 50)" -ForegroundColor Gray
Write-Host "✅ Retornar respuesta con casco + sensores creados" -ForegroundColor White
