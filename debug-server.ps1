# Test simple para debuggear el problema
Write-Host "🔍 Verificando estado del servidor..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

try {
    # Primero verificar que el servidor esté corriendo
    Write-Host "📋 1. Verificando health check..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET
    
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Servidor funcionando correctamente" -ForegroundColor Green
        Write-Host "Servicio: $($healthResponse.service)" -ForegroundColor Cyan
        Write-Host "Timestamp: $($healthResponse.timestamp)" -ForegroundColor Cyan
    }
    
    # Luego probar login con datos más básicos
    Write-Host "`n📋 2. Probando login..." -ForegroundColor Yellow
    
    $loginData = @{
        email = "admin@test.com"
        password = "123456789"
    }
    
    $response = Invoke-WebRequest -Uri "$serverUrl/login" -Method POST -Body ($loginData | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Response: $($response.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        
        # Intentar leer el contenido del error
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "Error Content: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "No se pudo leer el contenido del error" -ForegroundColor Red
        }
    }
}

Write-Host "`n🏁 Debug completado." -ForegroundColor Green
