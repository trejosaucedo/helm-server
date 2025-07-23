# 🧪 Script de diagnóstico de cascos

Write-Host "🧪 Diagnosticando creación de cascos..." -ForegroundColor Cyan

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
    
    # Probar crear casco sin supervisorId (debería usar el del token)
    $cascoData1 = @{
        physicalId = "CASCO001"
    } | ConvertTo-Json
    
    Write-Host "📡 Probando crear casco sin supervisorId explícito..." -ForegroundColor Yellow
    try {
        $cascoResponse1 = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method Post -Body $cascoData1 -ContentType "application/json" -Headers $supervisorHeaders
        Write-Host "✅ Casco creado exitosamente: $($cascoResponse1.data.id)" -ForegroundColor Green
        Write-Host "   Physical ID: $($cascoResponse1.data.physicalId)" -ForegroundColor White
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
    }
    
    # Probar crear casco con supervisorId explícito
    $cascoData2 = @{
        physicalId = "CASCO002"
        supervisorId = $supervisorId
    } | ConvertTo-Json
    
    Write-Host "📡 Probando crear casco con supervisorId explícito..." -ForegroundColor Yellow
    try {
        $cascoResponse2 = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method Post -Body $cascoData2 -ContentType "application/json" -Headers $supervisorHeaders
        Write-Host "✅ Casco creado exitosamente: $($cascoResponse2.data.id)" -ForegroundColor Green
        Write-Host "   Physical ID: $($cascoResponse2.data.physicalId)" -ForegroundColor White
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
    }

} catch {
    Write-Host "❌ Error general: $($_.Exception.Message)" -ForegroundColor Red
}
