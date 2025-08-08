# Test de creación de casco con sensores automáticos

# Configuración
$baseUrl = "http://localhost:3333"

# 1. Login como admin
Write-Host "=== LOGIN COMO ADMIN ===" -ForegroundColor Green
$loginData = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginData -ContentType "application/json"
    $accessToken = $loginResponse.data.accessToken
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "Token: $($accessToken.Substring(0,20))..."
} catch {
    Write-Host "❌ Error en login: $_" -ForegroundColor Red
    exit 1
}

# 2. Crear un nuevo casco
Write-Host "`n=== CREAR CASCO CON SENSORES AUTOMÁTICOS ===" -ForegroundColor Green
$cascoData = @{
    physicalId = "CASCO-$(Get-Random -Minimum 1000 -Maximum 9999)"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method POST -Body $cascoData -Headers $headers
    Write-Host "✅ Casco creado exitosamente" -ForegroundColor Green
    Write-Host "Casco ID: $($cascoResponse.data.casco.id)"
    Write-Host "Physical ID: $($cascoResponse.data.casco.physicalId)"
    Write-Host "Sensores creados: $($cascoResponse.data.sensors.Count)"
    
    # Mostrar los sensores creados
    Write-Host "`n=== SENSORES CREADOS ===" -ForegroundColor Yellow
    foreach ($sensor in $cascoResponse.data.sensors) {
        Write-Host "- $($sensor.type): $($sensor.name)" -ForegroundColor Cyan
        Write-Host "  ID: $($sensor.id)"
        Write-Host "  Unidad: $($sensor.unit)"
        Write-Host "  Sample Rate: $($sensor.sampleRate)ms"
        if ($sensor.alertThreshold) {
            Write-Host "  Alert Threshold: $($sensor.alertThreshold)"
        }
        Write-Host ""
    }
    
} catch {
    Write-Host "❌ Error al crear casco: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# 3. Verificar que los sensores están en la base de datos
if ($cascoResponse -and $cascoResponse.data.casco.id) {
    Write-Host "=== VERIFICAR SENSORES EN BD ===" -ForegroundColor Green
    $cascoId = $cascoResponse.data.casco.id
    
    try {
        $sensorsResponse = Invoke-RestMethod -Uri "$baseUrl/cascos/$cascoId/sensores" -Method GET -Headers $headers
        Write-Host "✅ Sensores obtenidos de la BD: $($sensorsResponse.data.Count)" -ForegroundColor Green
        
        foreach ($sensor in $sensorsResponse.data) {
            Write-Host "- $($sensor.type): $($sensor.name) (Activo: $($sensor.isActive))" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Error al verificar sensores: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== PRUEBA COMPLETADA ===" -ForegroundColor Green
