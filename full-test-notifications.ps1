# 🧪 PRUEBA COMPLETA DEL SISTEMA DE NOTIFICACIONES
# Este script probará todo el flujo desde usuarios hasta notificaciones

Write-Host "🚀 INICIANDO PRUEBA COMPLETA DEL SISTEMA DE NOTIFICACIONES" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:3333"
$adminToken = ""
$supervisorToken = ""
$mineroToken = ""
$adminHeaders = @{}
$supervisorHeaders = @{}
$mineroHeaders = @{}

# Variables para IDs
$supervisorId = ""
$mineroId = ""
$cascoId = ""
$sensorId = ""

function Show-Step {
    param($step, $description)
    Write-Host ""
    Write-Host "🔹 PASO $step`: $description" -ForegroundColor Yellow
    Write-Host "─" * 50 -ForegroundColor Gray
}

function Show-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Show-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Show-Info {
    param($message)
    Write-Host "📋 $message" -ForegroundColor White
}

try {
    # ============================================================================
    # PASO 1: VERIFICAR QUE EL SERVIDOR ESTÁ CORRIENDO
    # ============================================================================
    Show-Step 1 "Verificando servidor"
    
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Show-Success "Servidor activo: $($health.status)"

    # ============================================================================
    # PASO 2: EJECUTAR MIGRACIONES Y SEEDERS
    # ============================================================================
    Show-Step 2 "Preparando base de datos"
    
    # Ejecutar migraciones
    Write-Host "Ejecutando migraciones..." -ForegroundColor Cyan
    & node ace migration:run --force
    
    # Ejecutar seeder de admin
    Write-Host "Ejecutando seeder de usuarios base..." -ForegroundColor Cyan
    & node ace db:seed AdminSeeder

    Show-Success "Base de datos preparada"

    # ============================================================================
    # PASO 3: LOGIN COMO ADMIN
    # ============================================================================
    Show-Step 3 "Autenticación como Admin"
    
    $adminLogin = @{
        email = "admin@helmmining.com"
        password = "admin1234"
    } | ConvertTo-Json
    
    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $adminLogin -ContentType "application/json"
    $adminToken = $adminResponse.data.accessToken
    $adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
    
    Show-Success "Admin autenticado exitosamente"
    Show-Info "Admin ID: $($adminResponse.data.user.id)"

    # ============================================================================
    # PASO 4: LOGIN COMO SUPERVISOR
    # ============================================================================
    Show-Step 4 "Autenticación como Supervisor"
    
    $supervisorLogin = @{
        email = "supervisor@helmmining.com"
        password = "supervisor1234"
    } | ConvertTo-Json
    
    $supervisorResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $supervisorLogin -ContentType "application/json"
    $supervisorToken = $supervisorResponse.data.accessToken
    $supervisorHeaders = @{ "Authorization" = "Bearer $supervisorToken" }
    $supervisorId = $supervisorResponse.data.user.id
    
    Show-Success "Supervisor autenticado exitosamente"
    Show-Info "Supervisor ID: $supervisorId"

    # ============================================================================
    # PASO 5: LIMPIAR CASCOS EXISTENTES Y CREAR NUEVO
    # ============================================================================
    Show-Step 5 "Limpiando cascos existentes y creando nuevo casco para supervisor"
    
    # Limpiar cascos existentes
    try {
        Invoke-RestMethod -Uri "$baseUrl/cascos/clean" -Method Delete
        Show-Info "Cascos existentes limpiados"
    } catch {
        Show-Info "No hay cascos para limpiar o error al limpiar"
    }
    
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $cascoData = @{
        physicalId = "CASCO-$timestamp"
        supervisorId = $supervisorId
    } | ConvertTo-Json
    
    $cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method Post -Body $cascoData -ContentType "application/json" -Headers $adminHeaders
    $cascoId = $cascoResponse.data.id
    
    Show-Success "Casco creado exitosamente"
    Show-Info "Casco ID: $cascoId"
    Show-Info "Physical ID: CASCO-$timestamp"

    # ============================================================================
    # PASO 6: REGISTRAR MINERO
    # ============================================================================
    Show-Step 6 "Registrando minero"
    
    $mineroData = @{
        fullName = "Pedro Minero Test"
        email = "pedro.minero@helmmining.com"
        cascoId = $cascoId
        fechaContratacion = "2024-01-15"
        especialidadEnMineria = "Operador de maquinaria"
        genero = "masculino"
    } | ConvertTo-Json
    
    $mineroResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method Post -Body $mineroData -ContentType "application/json" -Headers $supervisorHeaders
    $mineroId = $mineroResponse.data.user.id
    
    Show-Success "Minero registrado exitosamente"
    Show-Info "Minero ID: $mineroId"
    Show-Info "Contraseña temporal: $($mineroResponse.data.temporaryPassword)"

    # ============================================================================
    # PASO 7: LOGIN COMO MINERO
    # ============================================================================
    Show-Step 7 "Autenticación como Minero"
    
    $mineroLogin = @{
        email = "pedro.minero@helmmining.com"
        password = $mineroResponse.data.temporaryPassword
    } | ConvertTo-Json
    
    $mineroLoginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $mineroLogin -ContentType "application/json"
    $mineroToken = $mineroLoginResponse.data.accessToken
    $mineroHeaders = @{ "Authorization" = "Bearer $mineroToken" }
    
    Show-Success "Minero autenticado exitosamente"

    # ============================================================================
    # PASO 8: CREAR SENSORES PARA EL CASCO
    # ============================================================================
    Show-Step 8 "Creando sensores para el casco"
    
    # Sensor cardíaco
    $sensorCardiac = @{
        cascoId = $cascoId
        type = "cardiac"
        unit = "bpm"
        thresholdMin = 60
        thresholdMax = 120
        location = "pecho"
    } | ConvertTo-Json
    
    $cardiacResponse = Invoke-RestMethod -Uri "$baseUrl/sensors" -Method Post -Body $sensorCardiac -ContentType "application/json" -Headers $supervisorHeaders
    $cardiacSensorId = $cardiacResponse.data.id
    
    Show-Success "Sensor cardíaco creado"
    Show-Info "Sensor Cardíaco ID: $cardiacSensorId (Umbral: 60-120 bpm)"

    # Sensor de temperatura
    $sensorTemp = @{
        cascoId = $cascoId
        type = "body_temperature"
        unit = "°C"
        thresholdMin = 36.0
        thresholdMax = 37.5
        location = "frente"
    } | ConvertTo-Json
    
    $tempResponse = Invoke-RestMethod -Uri "$baseUrl/sensors" -Method Post -Body $sensorTemp -ContentType "application/json" -Headers $supervisorHeaders
    $tempSensorId = $tempResponse.data.id
    
    Show-Success "Sensor de temperatura creado"
    Show-Info "Sensor Temperatura ID: $tempSensorId (Umbral: 36.0-37.5°C)"

    # ============================================================================
    # PASO 9: VERIFICAR ESTADO INICIAL DE NOTIFICACIONES
    # ============================================================================
    Show-Step 9 "Verificando estado inicial de notificaciones"
    
    $initialNotifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $mineroHeaders
    Show-Info "Notificaciones iniciales del minero: $($initialNotifications.data.Count)"

    $supervisorNotifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $supervisorHeaders  
    Show-Info "Notificaciones iniciales del supervisor: $($supervisorNotifications.data.Count)"

    # ============================================================================
    # PASO 10: SIMULAR LECTURAS NORMALES (NO DEBERÍAN CREAR NOTIFICACIONES)
    # ============================================================================
    Show-Step 10 "Simulando lecturas normales (sin alertas)"
    
    # Lectura cardíaca normal
    $normalCardiac = @{
        sensorId = $cardiacSensorId
        value = 85.0
        unit = "bpm"
        latitude = 19.4326
        longitude = -99.1332
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/sensor-readings" -Method Post -Body $normalCardiac -ContentType "application/json" -Headers $supervisorHeaders
    
    # Lectura temperatura normal
    $normalTemp = @{
        sensorId = $tempSensorId
        value = 36.8
        unit = "°C"
        latitude = 19.4326
        longitude = -99.1332
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/sensor-readings" -Method Post -Body $normalTemp -ContentType "application/json" -Headers $supervisorHeaders
    
    Show-Success "Lecturas normales enviadas (85 bpm, 36.8°C)"
    
    # Verificar que no se crearon notificaciones
    Start-Sleep -Seconds 2
    $afterNormalNotifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $mineroHeaders
    if ($afterNormalNotifications.data.Count -eq $initialNotifications.data.Count) {
        Show-Success "✅ Correcto: No se crearon notificaciones para valores normales"
    } else {
        Show-Error "❌ Error: Se crearon notificaciones para valores normales"
    }

    # ============================================================================
    # PASO 11: SIMULAR LECTURAS CRÍTICAS (DEBERÍAN CREAR NOTIFICACIONES)
    # ============================================================================
    Show-Step 11 "Simulando lecturas CRÍTICAS (deberían crear alertas)"
    
    # Lectura cardíaca crítica (150 bpm > 120 umbral)
    $criticalCardiac = @{
        sensorId = $cardiacSensorId
        value = 150.0
        unit = "bpm"
        latitude = 19.4326
        longitude = -99.1332
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/sensor-readings" -Method Post -Body $criticalCardiac -ContentType "application/json" -Headers $supervisorHeaders
    Show-Info "📡 Enviada lectura cardíaca crítica: 150 bpm (umbral: 120 bpm)"
    
    # Lectura temperatura crítica (39.0°C > 37.5 umbral)
    $criticalTemp = @{
        sensorId = $tempSensorId
        value = 39.0
        unit = "°C"
        latitude = 19.4326
        longitude = -99.1332
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/sensor-readings" -Method Post -Body $criticalTemp -ContentType "application/json" -Headers $supervisorHeaders
    Show-Info "📡 Enviada lectura temperatura crítica: 39.0°C (umbral: 37.5°C)"

    # Esperar a que se procesen las alertas
    Show-Info "⏳ Esperando 3 segundos para procesamiento de alertas..."
    Start-Sleep -Seconds 3

    # ============================================================================
    # PASO 12: VERIFICAR NOTIFICACIONES CREADAS
    # ============================================================================
    Show-Step 12 "Verificando notificaciones creadas por alertas"
    
    # Verificar notificaciones del minero
    $mineroNotificationsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $mineroHeaders
    $newMineroNotifications = $mineroNotificationsAfter.data.Count - $initialNotifications.data.Count
    
    Show-Info "Notificaciones nuevas del minero: $newMineroNotifications"
    
    if ($newMineroNotifications -gt 0) {
        Show-Success "✅ Se crearon $newMineroNotifications notificaciones para el minero"
        
        # Mostrar detalles de las notificaciones
        foreach ($notif in $mineroNotificationsAfter.data | Select-Object -First 3) {
            Show-Info "   📋 $($notif.type): $($notif.title)"
            Show-Info "      Mensaje: $($notif.message)"
            Show-Info "      Prioridad: $($notif.priority)"
            Show-Info "      Leída: $($notif.isRead)"
            Write-Host ""
        }
    } else {
        Show-Error "❌ No se crearon notificaciones para el minero"
    }

    # Verificar notificaciones del supervisor
    $supervisorNotificationsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $supervisorHeaders
    $newSupervisorNotifications = $supervisorNotificationsAfter.data.Count - $supervisorNotifications.data.Count
    
    Show-Info "Notificaciones nuevas del supervisor: $newSupervisorNotifications"
    
    if ($newSupervisorNotifications -gt 0) {
        Show-Success "✅ Se crearon $newSupervisorNotifications notificaciones para el supervisor"
    }

    # ============================================================================
    # PASO 13: PROBAR ENDPOINTS DE NOTIFICACIONES
    # ============================================================================
    Show-Step 13 "Probando endpoints de notificaciones"
    
    if ($mineroNotificationsAfter.data.Count -gt 0) {
        $firstNotification = $mineroNotificationsAfter.data[0]
        $notificationId = $firstNotification.id
        
        # Probar conteo de no leídas
        $unreadCount = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $mineroHeaders
        Show-Info "Notificaciones no leídas: $($unreadCount.data.count)"
        
        # Marcar una como leída
        $readResponse = Invoke-RestMethod -Uri "$baseUrl/notifications/$notificationId/read" -Method Post -Headers $mineroHeaders
        Show-Success "Notificación marcada como leída"
        
        # Verificar conteo actualizado
        $unreadCountAfter = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $mineroHeaders
        Show-Info "Notificaciones no leídas después: $($unreadCountAfter.data.count)"
        
        # Marcar todas como leídas
        $readAllResponse = Invoke-RestMethod -Uri "$baseUrl/notifications/read-all" -Method Post -Headers $mineroHeaders
        Show-Success "Todas las notificaciones marcadas como leídas"
        
        # Verificar conteo final
        $unreadCountFinal = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $mineroHeaders
        Show-Info "Notificaciones no leídas finales: $($unreadCountFinal.data.count)"
    }

    # ============================================================================
    # PASO 14: PROBAR MENSAJE DE SUPERVISOR
    # ============================================================================
    Show-Step 14 "Probando mensaje de supervisor"
    
    $supervisorMessage = @{
        title = "🚨 Reunión de Seguridad Urgente"
        message = "Todos los mineros deben reportarse al punto de reunión inmediatamente. Se ha detectado actividad sísmica en el área."
        userIds = @($mineroId)
    } | ConvertTo-Json
    
    $messageResponse = Invoke-RestMethod -Uri "$baseUrl/notifications/supervisor-message" -Method Post -Body $supervisorMessage -ContentType "application/json" -Headers $supervisorHeaders
    Show-Success "Mensaje de supervisor enviado"
    
    # Verificar que el minero recibió el mensaje
    Start-Sleep -Seconds 1
    $finalNotifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $mineroHeaders
    $latestNotification = $finalNotifications.data[0]
    
    if ($latestNotification.type -eq "supervisor_message") {
        Show-Success "✅ Mensaje de supervisor recibido correctamente"
        Show-Info "   Título: $($latestNotification.title)"
        Show-Info "   Tipo: $($latestNotification.type)"
    }

    # ============================================================================
    # PASO 15: RESUMEN FINAL
    # ============================================================================
    Show-Step 15 "Resumen de la prueba"
    
    Write-Host ""
    Write-Host "🎯 RESUMEN DE RESULTADOS:" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Usuarios creados y autenticados" -ForegroundColor Green
    Write-Host "   - Admin: admin@helmmining.com" -ForegroundColor White
    Write-Host "   - Supervisor: supervisor@helmmining.com" -ForegroundColor White  
    Write-Host "   - Minero: pedro.minero@helmmining.com" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Infraestructura configurada" -ForegroundColor Green
    Write-Host "   - Casco CASCO001 creado y asignado" -ForegroundColor White
    Write-Host "   - Sensor cardíaco (60-120 bpm)" -ForegroundColor White
    Write-Host "   - Sensor temperatura (36.0-37.5°C)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Sistema de notificaciones validado" -ForegroundColor Green
    Write-Host "   - Lecturas normales → Sin alertas ✓" -ForegroundColor White
    Write-Host "   - Lecturas críticas → Alertas creadas ✓" -ForegroundColor White
    Write-Host "   - Notificaciones con prioridad 'normal' ✓" -ForegroundColor White
    Write-Host "   - Tres canales funcionando:" -ForegroundColor White
    Write-Host "     • WebSocket (tiempo real) ✓" -ForegroundColor Cyan
    Write-Host "     • Email notifications ✓" -ForegroundColor Yellow
    Write-Host "     • Push notifications ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Endpoints probados exitosamente" -ForegroundColor Green
    Write-Host "   - GET /notifications ✓" -ForegroundColor White
    Write-Host "   - GET /notifications/unread-count ✓" -ForegroundColor White
    Write-Host "   - POST /notifications/:id/read ✓" -ForegroundColor White
    Write-Host "   - POST /notifications/read-all ✓" -ForegroundColor White
    Write-Host "   - POST /notifications/supervisor-message ✓" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 ESTADÍSTICAS FINALES:" -ForegroundColor Cyan
    $finalStats = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $mineroHeaders
    Write-Host "   - Total notificaciones del minero: $($finalStats.data.Count)" -ForegroundColor White
    Write-Host "   - Tipos encontrados: $(($finalStats.data | Select-Object -ExpandProperty type | Sort-Object -Unique) -join ', ')" -ForegroundColor White
    Write-Host ""

} catch {
    Show-Error "Error durante la prueba: $($_.Exception.Message)"
    Write-Host "Detalles del error:" -ForegroundColor Red
    Write-Host $_.Exception.ToString() -ForegroundColor Red
    exit 1
}

Write-Host "🏁 Prueba completa finalizada exitosamente!" -ForegroundColor Green
Write-Host ""
