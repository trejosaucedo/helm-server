# Test para el endpoint batch de sensores
$baseUrl = "http://127.0.0.1:3333"

Write-Host "🧪 Test: Endpoint batch para sensores" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@helmmining.com","password":"admin1234"}'
$token = $loginResponse.data.accessToken
Write-Host "✅ Login exitoso" -ForegroundColor Green

# 2. Crear casco
$cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method POST -ContentType "application/json" -Headers @{Authorization = "Bearer $token"} -Body '{"physicalId":"CASCO-BATCH-TEST-001"}'
$cascoId = $cascoResponse.data.casco.id
$sensores = $cascoResponse.data.sensors
Write-Host "✅ Casco creado: $cascoId" -ForegroundColor Green

# 3. Obtener minero
$minerosResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method GET -Headers @{Authorization = "Bearer $token"}
$mineroId = $minerosResponse.data[0].id
Write-Host "✅ Minero: $mineroId" -ForegroundColor Green

# 4. Preparar datos batch
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$deviceTsMs = [long]((Get-Date).Subtract([datetime]'1970-01-01')).TotalMilliseconds

$batchData = @(
    @{
        sensorId = ($sensores | Where-Object { $_.type -eq "body_temperature" }).id
        identificador = "TMP"
        mineroId = $mineroId
        value = 36.8
        unit = "C"
        timestamp = $timestamp
        metadata = @{
            tempC = 36.8
            deviceTsMs = $deviceTsMs
            batchIndex = 0
        }
    },
    @{
        sensorId = ($sensores | Where-Object { $_.type -eq "gas" }).id
        identificador = "MQ7"
        mineroId = $mineroId
        value = 45
        unit = "ppm"
        timestamp = $timestamp
        metadata = @{
            mq7 = 45
            mv = 2500
            deviceTsMs = $deviceTsMs
            batchIndex = 1
        }
    },
    @{
        sensorId = ($sensores | Where-Object { $_.type -eq "heart_rate" }).id
        identificador = "MAX"
        mineroId = $mineroId
        value = 75
        unit = "bpm"
        timestamp = $timestamp
        metadata = @{
            bpm = 75
            red = 1200
            ir = 1100
            contact = $true
            deviceTsMs = $deviceTsMs
            batchIndex = 2
        }
    },
    @{
        sensorId = ($sensores | Where-Object { $_.type -eq "gps" }).id
        identificador = "GPS"
        mineroId = $mineroId
        value = 1
        unit = "coords"
        timestamp = $timestamp
        location = @{
            latitude = 25.531466
            longitude = -103.322077
            accuracy = 5.0
        }
        metadata = @{
            gpsFix = $true
            sats = 8
            lat = 25.531466
            lng = -103.322077
            deviceTsMs = $deviceTsMs
            batchIndex = 3
        }
    }
)

Write-Host "`n📡 Enviando batch de $($batchData.Count) lecturas..." -ForegroundColor Yellow

try {
    $batchResponse = Invoke-RestMethod -Uri "$baseUrl/cascos/$cascoId/sensores/batch" -Method POST -ContentType "application/json" -Headers @{
        "x-device-token" = "batch-test-device-token"
    } -Body ($batchData | ConvertTo-Json -Depth 4)

    if ($batchResponse.success) {
        Write-Host "✅ Batch procesado exitosamente" -ForegroundColor Green
        Write-Host "📊 Resultados:" -ForegroundColor Cyan
        Write-Host "   - Procesadas: $($batchResponse.data.processed)" -ForegroundColor Green
        Write-Host "   - Errores: $($batchResponse.data.errors)" -ForegroundColor $(if ($batchResponse.data.errors -eq 0) { "Green" } else { "Red" })
        Write-Host "   - Mensaje: $($batchResponse.message)" -ForegroundColor White
        
        if ($batchResponse.data.results) {
            Write-Host "`n📝 Detalles de lecturas exitosas:" -ForegroundColor Cyan
            foreach ($result in $batchResponse.data.results) {
                Write-Host "   ✅ Índice $($result.index): $($result.sensorId)" -ForegroundColor Green
            }
        }
        
        if ($batchResponse.data.errors -gt 0) {
            Write-Host "`n❌ Errores encontrados:" -ForegroundColor Red
            foreach ($error in $batchResponse.data.errors) {
                Write-Host "   ❌ Índice $($error.index): $($error.error)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Error en batch: $($batchResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error enviando batch: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Verificar que los datos se guardaron
Write-Host "`n🔍 Verificando datos guardados..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $readingsResponse = Invoke-RestMethod -Uri "$baseUrl/sensors/readings?cascoId=$cascoId&limit=10" -Method GET -Headers @{
        Authorization = "Bearer $token"
    }

    if ($readingsResponse.success) {
        Write-Host "✅ Se encontraron $($readingsResponse.data.Count) lecturas en la BD" -ForegroundColor Green
        
        # Verificar identificadores únicos
        $identificadores = $readingsResponse.data | ForEach-Object { $_.identificador } | Sort-Object -Unique
        Write-Host "📋 Identificadores encontrados: $($identificadores -join ', ')" -ForegroundColor Cyan
        
        # Mostrar algunas lecturas
        Write-Host "`n📊 Primeras lecturas guardadas:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(3, $readingsResponse.data.Count); $i++) {
            $reading = $readingsResponse.data[$i]
            Write-Host "   $($i+1). $($reading.identificador): $($reading.value) $($reading.unit)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Error verificando datos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test de batch completado!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
