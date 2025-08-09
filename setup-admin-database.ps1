# Script para crear código de acceso directamente en la base de datos
Write-Host "🔧 Creando código de acceso directamente en MySQL..." -ForegroundColor Green

# Generar código de acceso aleatorio
$codigo = -join ((1..8) | ForEach {[char]((65..90) + (48..57) | Get-Random)})
$email = "admin@test.com"
$fechaCreacion = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "📋 Código generado: $codigo" -ForegroundColor Cyan
Write-Host "📧 Email: $email" -ForegroundColor Cyan

# Crear archivo SQL
$sqlContent = @"
-- Insertar código de acceso para crear admin
INSERT INTO access_codes (email, code, created_at, updated_at) 
VALUES ('$email', '$codigo', '$fechaCreacion', '$fechaCreacion')
ON DUPLICATE KEY UPDATE 
    code = '$codigo', 
    updated_at = '$fechaCreacion';

-- Verificar que se insertó
SELECT * FROM access_codes WHERE email = '$email';
"@

Set-Content -Path "insert-access-code.sql" -Value $sqlContent -Encoding UTF8

Write-Host "`n✅ Archivo SQL creado: insert-access-code.sql" -ForegroundColor Green
Write-Host "`n🔧 PASOS A SEGUIR:" -ForegroundColor Yellow
Write-Host "1. Ejecuta el SQL en tu base de datos:" -ForegroundColor White
Write-Host "   mysql -u tu_usuario -p helm_server < insert-access-code.sql" -ForegroundColor Gray

Write-Host "`n2. Luego registra el usuario con este comando:" -ForegroundColor White
$registerCommand = @"
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "$email",
    "password": "123456789",
    "codigo": "$codigo"
  }'
"@
Write-Host $registerCommand -ForegroundColor Gray

Write-Host "`n3. Después cambia el rol a admin:" -ForegroundColor White
Write-Host "   UPDATE users SET role = 'admin' WHERE email = '$email';" -ForegroundColor Gray

Write-Host "`n📝 También puedes usar esta versión de PowerShell para el registro:" -ForegroundColor Yellow
$psRegister = @"
`$userData = @{
    fullName = "Admin User"
    email = "$email"
    password = "123456789"
    codigo = "$codigo"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/register" -Method POST -Body `$userData -ContentType "application/json"
"@
Set-Content -Path "register-admin.ps1" -Value $psRegister -Encoding UTF8
Write-Host "✅ Script de registro creado: register-admin.ps1" -ForegroundColor Green

Write-Host "`n🎯 RESUMEN:" -ForegroundColor Green
Write-Host "Código: $codigo" -ForegroundColor Cyan
Write-Host "Email: $email" -ForegroundColor Cyan
Write-Host "Password: 123456789" -ForegroundColor Cyan
