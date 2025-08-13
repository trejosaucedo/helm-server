# Test para verificar que id y sensorLocalId se guarden correctamente
# Este script prueba el endpoint POST /cascos/:cascoId/sensores/:sensorId

$baseUrl = "http://127.0.0.1:3333"

Write-Host "🧪 Test: Verificando que id y sensorLocalId se guarden en MongoDB" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Login como admin
Write-Host "1️⃣ Iniciando sesión como admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body (@{
    email = "admin@helmmining.com"
    password = "admin1234"
} | ConvertTo-Json)

if (-not $loginResponse.success) {
    Write-Host "❌ Error en login: $($loginResponse.message)" -ForegroundColor Red
    exit 1
}

$token = $loginResponse.data.accessToken
Write-Host "✅ Login exitoso" -ForegroundColor Green

# 2. Crear un casco nuevo para la prueba
Write-Host "`n2️⃣ Creando casco de prueba..." -ForegroundColor Yellow
$cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method POST -ContentType "application/json" -Headers @{
    Authorization = "Bearer $token"
} -Body (@{
    physicalId = "CASCO-TEST-ID-LOCALID-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json)

if (-not $cascoResponse.success) {
    Write-Host "❌ Error creando casco: $($cascoResponse.message)" -ForegroundColor Red
    exit 1
}

$cascoId = $cascoResponse.data.casco.id
Write-Host "✅ Casco creado: $cascoId" -ForegroundColor Green

# Los sensores ya vienen en la respuesta del casco
$sensores = $cascoResponse.data.sensors
Write-Host "✅ Sensores obtenidos del casco: $($sensores.Count)" -ForegroundColor Green

# Buscar sensor de temperatura
$sensorTemp = $sensores | Where-Object { $_.type -eq "body_temperature" }
if (-not $sensorTemp) {
    Write-Host "❌ No se encontró sensor de temperatura" -ForegroundColor Red
    exit 1
}

$sensorId = $sensorTemp.id
Write-Host "✅ Sensor de temperatura encontrado: $sensorId" -ForegroundColor Green

# 3. Obtener un minero para la prueba
Write-Host "`n3️⃣ Obteniendo minero de prueba..." -ForegroundColor Yellow
$minerosResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method GET -Headers @{
    Authorization = "Bearer $token"
}

if (-not $minerosResponse.success -or $minerosResponse.data.Count -eq 0) {
    Write-Host "❌ No se encontró minero: $($minerosResponse.message)" -ForegroundColor Red
    exit 1
}

$mineroId = $minerosResponse.data[0].id
Write-Host "✅ Minero encontrado: $mineroId" -ForegroundColor Green

# 4. Enviar datos con id y sensorLocalId
Write-Host "`n4️⃣ Enviando datos con id y sensorLocalId..." -ForegroundColor Yellow

$deviceId = "DEVICE-$(Get-Date -Format 'yyyyMMddHHmmss')"
$sensorLocalId = "TMP-001"

$sensorData = @{
    id = $deviceId
    sensorId = $sensorId
    sensorLocalId = $sensorLocalId
    identificador = "TMP"
    mineroId = $mineroId
    value = 36.8
    unit = "C"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    metadata = @{
        tempC = 36.8
        deviceTsMs = [long]((Get-Date).Subtract([datetime]'1970-01-01')).TotalMilliseconds
        testField = "test-id-sensorlocalid"
    }
}

try {
    $publishResponse = Invoke-RestMethod -Uri "$baseUrl/cascos/$cascoId/sensores/$sensorId" -Method POST -ContentType "application/json" -Headers @{
        "x-device-token" = "test-device-token-123"
    } -Body ($sensorData | ConvertTo-Json -Depth 3)

    if ($publishResponse.success) {
        Write-Host "✅ Datos enviados correctamente" -ForegroundColor Green
        Write-Host "📊 Datos enviados:" -ForegroundColor Cyan
        Write-Host "   - Device ID: $deviceId" -ForegroundColor White
        Write-Host "   - Sensor Local ID: $sensorLocalId" -ForegroundColor White
        Write-Host "   - Sensor ID: $sensorId" -ForegroundColor White
        Write-Host "   - Valor: $($sensorData.value) $($sensorData.unit)" -ForegroundColor White
    } else {
        Write-Host "❌ Error enviando datos: $($publishResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error en la petición: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Verificar que los datos se guardaron
Write-Host "`n5️⃣ Verificando que los datos se guardaron en MongoDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $readingsResponse = Invoke-RestMethod -Uri "$baseUrl/sensors/readings?sensorId=$sensorId&limit=1" -Method GET -Headers @{
        Authorization = "Bearer $token"
    }

    if ($readingsResponse.success -and $readingsResponse.data.Count -gt 0) {
        $lastReading = $readingsResponse.data[0]
        Write-Host "✅ Lectura encontrada en la base de datos" -ForegroundColor Green
        
        # Verificar campos específicos
        Write-Host "`n📋 Verificación de campos:" -ForegroundColor Cyan
        
        # Verificar localId (que viene del campo 'id' enviado)
        if ($lastReading.PSObject.Properties['localId'] -and $lastReading.localId -eq $deviceId) {
            Write-Host "   ✅ localId guardado correctamente: $($lastReading.localId)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ localId no encontrado o incorrecto" -ForegroundColor Red
        }
        
        # Verificar sensorLocalId
        if ($lastReading.PSObject.Properties['sensorLocalId'] -and $lastReading.sensorLocalId -eq $sensorLocalId) {
            Write-Host "   ✅ sensorLocalId guardado correctamente: $($lastReading.sensorLocalId)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ sensorLocalId no encontrado o incorrecto" -ForegroundColor Red
        }
        
        # Verificar otros campos
        Write-Host "   ✅ sensorId: $($lastReading.sensorId)" -ForegroundColor Green
        Write-Host "   ✅ cascoId: $($lastReading.cascoId)" -ForegroundColor Green
        Write-Host "   ✅ mineroId: $($lastReading.mineroId)" -ForegroundColor Green
        Write-Host "   ✅ value: $($lastReading.value)" -ForegroundColor Green
        Write-Host "   ✅ timestamp: $($lastReading.timestamp)" -ForegroundColor Green
        
        # Mostrar metadata si contiene el campo de prueba
        if ($lastReading.metadata) {
            $metadata = $lastReading.metadata | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($metadata -and $metadata.testField -eq "test-id-sensorlocalid") {
                Write-Host "   ✅ metadata de prueba encontrado: $($metadata.testField)" -ForegroundColor Green
            }
        }
        
    } else {
        Write-Host "❌ No se encontraron lecturas recientes" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error obteniendo lecturas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test completado!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
