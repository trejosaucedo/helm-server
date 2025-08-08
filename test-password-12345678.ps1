# Test específico para la contraseña 12345678
Write-Host "🔍 Probando contraseña específica: 12345678" -ForegroundColor Green

$serverUrl = "http://localhost:3333"
$email = "admin@helmmining.com"
$password = "12345678"

try {
    Write-Host "📧 Email: $email" -ForegroundColor Cyan
    Write-Host "🔑 Password: $password" -ForegroundColor Cyan
    
    $loginData = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    Write-Host "`n📋 Intentando login..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$serverUrl/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "🎉 ¡ÉXITO! La contraseña es correcta!" -ForegroundColor Green
        Write-Host "Usuario: $($response.data.user.email)" -ForegroundColor Cyan
        Write-Host "Role: $($response.data.user.role)" -ForegroundColor Cyan
        Write-Host "ID: $($response.data.user.id)" -ForegroundColor Cyan
        Write-Host "Access Token: $($response.data.accessToken.Substring(0,20))..." -ForegroundColor Cyan
        
        # Guardar credenciales exitosas
        $credentials = @"
Email: $email
Password: $password
Role: $($response.data.user.role)
Access Token: $($response.data.accessToken)
"@
        Set-Content -Path "admin-credentials-found.txt" -Value $credentials
        Write-Host "`n✅ Credenciales guardadas en: admin-credentials-found.txt" -ForegroundColor Green
        
        # Actualizar el test principal con la contraseña correcta
        Write-Host "`n🔧 Actualizando test principal..." -ForegroundColor Yellow
        
        $testContent = Get-Content "test-create-casco-with-sensors.ps1" -Raw
        $updatedTest = $testContent -replace '"password": "123456789"', '"password": "12345678"'
        Set-Content -Path "test-create-casco-with-sensors.ps1" -Value $updatedTest
        
        Write-Host "✅ Test actualizado con la contraseña correcta" -ForegroundColor Green
        
        Write-Host "`n🚀 ¡AHORA PUEDES PROBAR LA FUNCIONALIDAD COMPLETA!" -ForegroundColor Green
        Write-Host "Ejecuta: .\test-create-casco-with-sensors.ps1" -ForegroundColor White
        
        Write-Host "`n🎯 El test debería:" -ForegroundColor Yellow
        Write-Host "✅ Hacer login exitoso" -ForegroundColor White
        Write-Host "✅ Crear un casco nuevo" -ForegroundColor White
        Write-Host "✅ Crear automáticamente 4 sensores" -ForegroundColor White
        Write-Host "✅ Mostrar el resultado completo" -ForegroundColor White
        
    } else {
        Write-Host "❌ Login falló: $($response.message)" -ForegroundColor Red
    }
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "❌ Contraseña incorrecta (401 Unauthorized)" -ForegroundColor Red
        Write-Host "La contraseña '12345678' no es correcta para este usuario." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Detalles: $($errorDetails.message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🏁 Test de contraseña específica completado." -ForegroundColor Green
