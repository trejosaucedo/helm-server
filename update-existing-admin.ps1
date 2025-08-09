# Script para cambiar contraseña del admin existente
Write-Host "🔧 Cambiando contraseña del admin existente..." -ForegroundColor Green

$email = "admin@helmmining.com"
$newPassword = "123456789"

# Crear archivo SQL para cambiar la contraseña
$sqlContent = @"
-- Cambiar contraseña del admin existente
-- Nota: Necesitarás hashear la contraseña con el mismo método que usa AdonisJS

-- Opción 1: Si puedes usar AdonisJS para hashear
-- En tinker: Hash.make('123456789')

-- Opción 2: Contraseña temporal sin hashear (NO RECOMENDADO PARA PRODUCCIÓN)
-- UPDATE users SET password = '123456789' WHERE email = 'admin@helmmining.com';

-- Opción 3: Verificar el usuario actual
SELECT id, email, role, created_at FROM users WHERE email = 'admin@helmmining.com';
"@

Set-Content -Path "update-admin-password.sql" -Value $sqlContent -Encoding UTF8

Write-Host "✅ SQL creado: update-admin-password.sql" -ForegroundColor Green

Write-Host "`n🔧 MÉTODO RECOMENDADO - Usar AdonisJS Tinker:" -ForegroundColor Yellow
Write-Host "1. Ejecuta: node ace tinker" -ForegroundColor White
Write-Host "2. En tinker ejecuta:" -ForegroundColor White
Write-Host "   const Hash = (await import('@adonisjs/core/hash')).default" -ForegroundColor Gray
Write-Host "   const hashedPassword = await Hash.make('$newPassword')" -ForegroundColor Gray
Write-Host "   console.log(hashedPassword)" -ForegroundColor Gray
Write-Host "   const user = await User.findByOrFail('email', '$email')" -ForegroundColor Gray
Write-Host "   user.password = hashedPassword" -ForegroundColor Gray
Write-Host "   await user.save()" -ForegroundColor Gray
Write-Host "   console.log('Contraseña actualizada!')" -ForegroundColor Gray

Write-Host "`n🚀 MÉTODO RÁPIDO - Script AdonisJS:" -ForegroundColor Cyan
$tinkerScript = @"
import User from '#models/user'
import { Hash } from '@adonisjs/core/hash'

// Cambiar contraseña del admin
const user = await User.findByOrFail('email', '$email')
user.password = await Hash.make('$newPassword')
await user.save()
console.log('✅ Contraseña del admin actualizada!')
console.log('Email:', user.email)
console.log('Role:', user.role)
"@

Set-Content -Path "update-admin-tinker.js" -Value $tinkerScript -Encoding UTF8
Write-Host "✅ Script de tinker creado: update-admin-tinker.js" -ForegroundColor Green

Write-Host "`n📋 Para ejecutar el script:" -ForegroundColor Yellow
Write-Host "node ace tinker < update-admin-tinker.js" -ForegroundColor Gray

Write-Host "`n🎯 DESPUÉS DE CAMBIAR LA CONTRASEÑA:" -ForegroundColor Green
Write-Host "Email: $email" -ForegroundColor Cyan
Write-Host "Nueva password: $newPassword" -ForegroundColor Cyan
Write-Host "Rol: admin (ya existente)" -ForegroundColor Cyan

Write-Host "`n🚀 Luego podrás probar:" -ForegroundColor Yellow
Write-Host ".\test-create-casco-with-sensors.ps1" -ForegroundColor Gray
