# Test para probar diferentes contraseñas comunes con el admin existente
Write-Host "🔍 Probando login con admin existente..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"
$email = "admin@helmmining.com"

# Lista de contraseñas comunes a probar
$passwords = @(
    "123456789",
    "admin123",
    "password",
    "admin",
    "123456",
    "password123",
    "admin@123",
    "helmadmin",
    "helm123"
)

Write-Host "📧 Email: $email" -ForegroundColor Cyan
Write-Host "🔑 Probando contraseñas comunes..." -ForegroundColor Yellow

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
            Write-Host "Access Token: $($response.data.accessToken -ne $null)" -ForegroundColor Cyan
            
            # Guardar credenciales exitosas
            $credentials = @"
Email: $email
Password: $password
Role: $($response.data.user.role)
"@
            Set-Content -Path "admin-credentials.txt" -Value $credentials
            Write-Host "`n✅ Credenciales guardadas en: admin-credentials.txt" -ForegroundColor Green
            
            Write-Host "`n🚀 Ahora puedes probar el test completo:" -ForegroundColor Yellow
            Write-Host ".\test-create-casco-with-sensors.ps1" -ForegroundColor Gray
            
            break
        }
        
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  ❌ Incorrecta" -ForegroundColor Red
        } else {
            Write-Host "  ⚠️ Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📋 Si ninguna funcionó, tendrás que:" -ForegroundColor Yellow
Write-Host "1. Conectarte directamente a MySQL" -ForegroundColor White
Write-Host "2. Ejecutar: UPDATE users SET password = '123456789' WHERE email = '$email';" -ForegroundColor Gray
Write-Host "3. O usar un hash manual con bcrypt/scrypt online" -ForegroundColor White

Write-Host "`n🏁 Test de contraseñas completado." -ForegroundColor Green
