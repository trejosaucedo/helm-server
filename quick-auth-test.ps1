# 🧪 Prueba simple de autenticación
Write-Host "🧪 Probando autenticación paso a paso..." -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:3333"

try {
    Write-Host "1. Haciendo login..." -ForegroundColor Yellow
    $loginData = @{
        email = "supervisor@helmmining.com"
        password = "supervisor1234"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.fullName)" -ForegroundColor White
    Write-Host "Role: $($loginResponse.data.user.role)" -ForegroundColor White
    
    $token = $loginResponse.data.accessToken
    Write-Host "Token length: $($token.Length)" -ForegroundColor Gray
    
    Write-Host "`n2. Probando endpoint /me inmediatamente..." -ForegroundColor Yellow
    $headers = @{ 
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers $headers
    Write-Host "✅ /me exitoso" -ForegroundColor Green
    Write-Host "Usuario desde /me: $($meResponse.data.fullName)" -ForegroundColor White
    
    Write-Host "`n3. Probando registro de minero inmediatamente..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    
    # Primero crear un casco
    $cascoData = @{
        physicalId = "TEST-$timestamp"
        supervisorId = $loginResponse.data.user.id
    } | ConvertTo-Json
    
    $cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method Post -Body $cascoData -ContentType "application/json" -Headers $headers
    Write-Host "✅ Casco creado: $($cascoResponse.data.id)" -ForegroundColor Green
    
    # Ahora registrar minero
    $mineroData = @{
        fullName = "Test Minero $timestamp"
        email = "test$timestamp@helmmining.com"
        cascoId = $cascoResponse.data.id
        genero = "masculino"
    } | ConvertTo-Json
    
    $mineroResponse = Invoke-RestMethod -Uri "$baseUrl/mineros" -Method Post -Body $mineroData -ContentType "application/json" -Headers $headers
    Write-Host "✅ Minero registrado exitosamente" -ForegroundColor Green
    Write-Host "Minero: $($mineroResponse.data.user.fullName)" -ForegroundColor White
    Write-Host "Contraseña: $($mineroResponse.data.temporaryPassword)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalles: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "No se pudieron obtener detalles del error" -ForegroundColor Red
        }
    }
}
