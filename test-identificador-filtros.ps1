# Test para verificar que identificador se guarde y se pueda filtrar
$baseUrl = "http://127.0.0.1:3333"

Write-Host "🧪 Test: Verificando identificador y filtros" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@helmmining.com","password":"admin1234"}'
$token = $loginResponse.data.accessToken
Write-Host "✅ Login exitoso" -ForegroundColor Green

# 2. Crear casco
$cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method POST -ContentType "application/json" -Headers @{Authorization = "Bearer $token"} -Body '{"physicalId":"CASCO-IDENTIFICADOR-TEST"}'
$cascoId = $cascoResponse.data.casco.id
$sensores = $cascoResponse.data.sensors
Write-Host "✅ Casco creado: $cascoId" -ForegroundColor Green

# 3. Obtener minero
$minerosResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method GET -Headers @{Authorization = "Bearer $token"}
$mineroId = $minerosResponse.data[0].id
Write-Host "✅ Minero: $mineroId" -ForegroundColor Green

# 4. Enviar datos con diferentes identificadores
$sensoresData = @(
    @{
        sensor = ($sensores | Where-Object { $_.type -eq "body_temperature" })
        identificador = "TMP"
        value = 36.5
        unit = "C"
    },
    @{
        sensor = ($sensores | Where-Object { $_.type -eq "gas" })
        identificador = "MQ7"
        value = 45
        unit = "ppm"
    },
    @{
        sensor = ($sensores | Where-Object { $_.type -eq "heart_rate" })
        identificador = "MAX"
        value = 75
        unit = "bpm"
    },
    @{
        sensor = ($sensores | Where-Object { $_.type -eq "gps" })
        identificador = "GPS"
        value = 1
        unit = "coords"
    }
)

Write-Host "`n📡 Enviando datos de sensores..." -ForegroundColor Yellow
foreach ($sensorData in $sensoresData) {
    $body = @{
        sensorId = $sensorData.sensor.id
        identificador = $sensorData.identificador
        mineroId = $mineroId
        value = $sensorData.value
        unit = $sensorData.unit
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        metadata = @{
            testType = "identificador-test"
            sensorType = $sensorData.identificador
        }
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/cascos/$cascoId/sensores/$($sensorData.sensor.id)" -Method POST -ContentType "application/json" -Headers @{"x-device-token" = "test-token"} -Body ($body | ConvertTo-Json -Depth 3)
        Write-Host "   ✅ $($sensorData.identificador): $($sensorData.value) $($sensorData.unit)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error enviando $($sensorData.identificador): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 2

# 5. Probar filtros
Write-Host "`n🔍 Probando filtros..." -ForegroundColor Yellow

# Filtro por identificador TMP
try {
    $tmpReadings = Invoke-RestMethod -Uri "$baseUrl/sensors/readings?identificador=TMP&limit=5" -Method GET -Headers @{Authorization = "Bearer $token"}
    Write-Host "   ✅ Filtro TMP: $($tmpReadings.data.Count) lecturas encontradas" -ForegroundColor Green
    if ($tmpReadings.data.Count -gt 0) {
        Write-Host "      - Identificador en primera lectura: $($tmpReadings.data[0].identificador)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error filtro TMP: $($_.Exception.Message)" -ForegroundColor Red
}

# Filtro por identificador MQ7
try {
    $mq7Readings = Invoke-RestMethod -Uri "$baseUrl/sensors/readings?identificador=MQ7&limit=5" -Method GET -Headers @{Authorization = "Bearer $token"}
    Write-Host "   ✅ Filtro MQ7: $($mq7Readings.data.Count) lecturas encontradas" -ForegroundColor Green
    if ($mq7Readings.data.Count -gt 0) {
        Write-Host "      - Identificador en primera lectura: $($mq7Readings.data[0].identificador)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error filtro MQ7: $($_.Exception.Message)" -ForegroundColor Red
}

# Filtro por cascoId
try {
    $cascoReadings = Invoke-RestMethod -Uri "$baseUrl/sensors/readings?cascoId=$cascoId&limit=10" -Method GET -Headers @{Authorization = "Bearer $token"}
    Write-Host "   ✅ Filtro por casco: $($cascoReadings.data.Count) lecturas encontradas" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error filtro casco: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test de identificadores completado!" -ForegroundColor Green
