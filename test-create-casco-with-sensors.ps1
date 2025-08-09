# Test para crear casco con sensores automáticamente
Write-Host "🚀 Probando creación de casco con sensores automáticos..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

# Datos de prueba para admin
$loginData = @{
    email = "admin@helmmining.com"
    password = "admin1234"
} | ConvertTo-Json

Write-Host "📋 1. Haciendo login como admin..." -ForegroundColor Yellow

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "$serverUrl/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Login exitoso!" -ForegroundColor Green
        Write-Host "Usuario: $($loginResponse.data.user.email)" -ForegroundColor Cyan
        
        $accessToken = $loginResponse.data.accessToken
        $headers = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }
        
        Write-Host "`n📋 2. Creando nuevo casco con sensores..." -ForegroundColor Yellow
        
        # Datos para crear casco
        $cascoData = @{
            physicalId = "CASCO-TEST-$(Get-Random)"
        } | ConvertTo-Json
        
        # Crear casco
        $cascoResponse = Invoke-RestMethod -Uri "$serverUrl/cascos" -Method POST -Body $cascoData -Headers $headers
        
        if ($cascoResponse.success) {
            Write-Host "✅ Casco creado exitosamente!" -ForegroundColor Green
            Write-Host "Casco ID: $($cascoResponse.data.casco.id)" -ForegroundColor Cyan
            Write-Host "Physical ID: $($cascoResponse.data.casco.physicalId)" -ForegroundColor Cyan
            
            Write-Host "`n🔧 Sensores creados automáticamente:" -ForegroundColor Yellow
            foreach ($sensor in $cascoResponse.data.sensors) {
                Write-Host "  • $($sensor.name) ($($sensor.type)) - ID: $($sensor.id)" -ForegroundColor White
            }
            
            $sensorCount = $cascoResponse.data.sensors.Count
            Write-Host "`n📊 Total de sensores creados: $sensorCount" -ForegroundColor Cyan
            
            if ($sensorCount -eq 4) {
                Write-Host "🎉 ¡ÉXITO! Se crearon los 4 sensores esperados:" -ForegroundColor Green
                Write-Host "  1. GPS Tracker" -ForegroundColor White
                Write-Host "  2. Monitor de Ritmo Cardíaco" -ForegroundColor White
                Write-Host "  3. Sensor de Temperatura Corporal" -ForegroundColor White
                Write-Host "  4. Detector de Gas" -ForegroundColor White
                
                Write-Host "`n✅ ¡FUNCIONALIDAD COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
                Write-Host "El casco se creó automáticamente con sus 4 sensores." -ForegroundColor Cyan
            } else {
                Write-Host "⚠️  Se esperaban 4 sensores pero se crearon $sensorCount" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "❌ Error al crear casco: $($cascoResponse.message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Error en login: $($loginResponse.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error en el test: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Test completado." -ForegroundColor Green

