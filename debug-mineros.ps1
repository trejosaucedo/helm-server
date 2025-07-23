# 🧪 Script de diagnóstico de registro de mineros

Write-Host "🧪 Diagnosticando registro de mineros..." -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:3333"

try {
    # Login supervisor
    $supervisorLogin = @{
        email = "supervisor@helmmining.com"
        password = "supervisor1234"
    } | ConvertTo-Json
    
    $supervisorResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $supervisorLogin -ContentType "application/json"
    $supervisorToken = $supervisorResponse.data.accessToken
    $supervisorHeaders = @{ "Authorization" = "Bearer $supervisorToken" }
    $supervisorId = $supervisorResponse.data.user.id
    
    Write-Host "✅ Supervisor autenticado: $supervisorId" -ForegroundColor Green
    
    # Crear casco primero
    $cascoData = @{
        physicalId = "TEST-CASCO-001"
        supervisorId = $supervisorId
    } | ConvertTo-Json
    
    $cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method Post -Body $cascoData -ContentType "application/json" -Headers $supervisorHeaders
    $cascoId = $cascoResponse.data.id
    Write-Host "✅ Casco creado: $cascoId" -ForegroundColor Green
    
    # Probar registro de minero
    $mineroData = @{
        fullName = "Test Minero"
        email = "test.minero@helmmining.com"
        cascoId = $cascoId
        genero = "masculino"
    } | ConvertTo-Json
    
    Write-Host "📡 Probando registro de minero..." -ForegroundColor Yellow
    Write-Host "Headers: $($supervisorHeaders | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host "Data: $mineroData" -ForegroundColor Gray
    
    try {
        $mineroResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method Post -Body $mineroData -ContentType "application/json" -Headers $supervisorHeaders
        Write-Host "✅ Minero registrado exitosamente: $($mineroResponse.data.user.id)" -ForegroundColor Green
        Write-Host "   Email: $($mineroResponse.data.user.email)" -ForegroundColor White
        Write-Host "   Contraseña temporal: $($mineroResponse.data.temporaryPassword)" -ForegroundColor White
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Intentar obtener más detalles del error
        try {
            $errorResponse = $_.Exception.Response
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalles del error: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "No se pudieron obtener más detalles del error" -ForegroundColor Red
        }
        
        # Verificar si el token sigue siendo válido
        Write-Host "🔍 Verificando token del supervisor..." -ForegroundColor Yellow
        try {
            $meResponse = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers $supervisorHeaders
            Write-Host "✅ Token válido - Usuario: $($meResponse.data.fullName)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Token inválido o expirado" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "❌ Error general: $($_.Exception.Message)" -ForegroundColor Red
}
