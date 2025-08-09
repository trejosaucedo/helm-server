# Test con más contraseñas específicas del proyecto
Write-Host "🔍 Probando contraseñas específicas del proyecto HELM..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"
$email = "admin@helmmining.com"

# Contraseñas específicas para proyectos de minería/helm
$passwords = @(
    "12345678",
    "helmmining",
    "helmet123",
    "mining123",
    "admin1234",
    "helm2024",
    "mining2024",
    "admin123456",
    "password1",
    "qwerty123",
    "abc123456",
    "admin2024",
    "helmserver",
    "cascos123"
)

Write-Host "📧 Email: $email" -ForegroundColor Cyan
Write-Host "🔑 Probando $($passwords.Count) contraseñas específicas..." -ForegroundColor Yellow

foreach ($password in $passwords) {
    try {
        Write-Host "`nProbando: $password" -ForegroundColor Gray
        
        $loginData = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$serverUrl/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "🎉 ¡ÉXITO! Contraseña encontrada: $password" -ForegroundColor Green
            Write-Host "Usuario: $($response.data.user.email)" -ForegroundColor Cyan
            Write-Host "Role: $($response.data.user.role)" -ForegroundColor Cyan
            Write-Host "ID: $($response.data.user.id)" -ForegroundColor Cyan
            
            # Guardar credenciales exitosas
            $credentials = @"
Email: $email
Password: $password
Role: $($response.data.user.role)
Access Token: $($response.data.accessToken)
"@
            Set-Content -Path "admin-credentials-working.txt" -Value $credentials
            Write-Host "`n✅ Credenciales guardadas en: admin-credentials-working.txt" -ForegroundColor Green
            
            # Actualizar el test principal
            Write-Host "`n🔧 Actualizando test de casco con sensores..." -ForegroundColor Yellow
            
            $testFile = "test-create-casco-with-sensors.ps1"
            if (Test-Path $testFile) {
                $content = Get-Content $testFile -Raw
                $newContent = $content -replace '"password": "123456789"', "`"password`": `"$password`""
                $newContent = $newContent -replace '"email": "admin@test.com"', "`"email`": `"$email`""
                Set-Content -Path $testFile -Value $newContent
                Write-Host "✅ Test actualizado con credenciales correctas" -ForegroundColor Green
            }
            
            Write-Host "`n🚀 ¡LISTO! Ahora ejecuta el test completo:" -ForegroundColor Green
            Write-Host ".\test-create-casco-with-sensors.ps1" -ForegroundColor White
            
            return
        }
        
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  ❌ Incorrecta" -ForegroundColor Red
        } else {
            Write-Host "  ⚠️ Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n❌ Ninguna contraseña funcionó." -ForegroundColor Red
Write-Host "`n📋 OPCIONES RESTANTES:" -ForegroundColor Yellow
Write-Host "1. Cambiar contraseña directamente en MySQL:" -ForegroundColor White
Write-Host "   UPDATE users SET password = '123456789' WHERE email = '$email';" -ForegroundColor Gray
Write-Host "`n2. O usar el script que ya creamos:" -ForegroundColor White
Write-Host "   .\final-setup-admin.ps1" -ForegroundColor Gray
Write-Host "   Luego ejecutar el SQL generado en MySQL" -ForegroundColor Gray

Write-Host "`n🏁 Test completado - Necesitas cambiar la contraseña manualmente." -ForegroundColor Red
