# Test para crear usuario admin si no existe
Write-Host "👤 Creando usuario admin para testing..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

try {
    # Primero verificar que el servidor esté corriendo
    Write-Host "📋 1. Verificando servidor..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET
    
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Servidor funcionando" -ForegroundColor Green
        
        # Intentar registrar un admin
        Write-Host "`n📋 2. Intentando registrar admin..." -ForegroundColor Yellow
        
        $adminData = @{
            fullName = "Admin Test"
            email = "admin@test.com"
            password = "123456789"
            codigo = "ADMIN123"
        }
        
        $response = Invoke-WebRequest -Uri "$serverUrl/register" -Method POST -Body ($adminData | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
        $responseData = $response.Content | ConvertFrom-Json
        
        if ($responseData.success) {
            Write-Host "✅ Admin creado exitosamente!" -ForegroundColor Green
            Write-Host "Usuario: $($responseData.data.user.email)" -ForegroundColor Cyan
            Write-Host "Role: $($responseData.data.user.role)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ Respuesta: $($responseData.message)" -ForegroundColor Yellow
        }
        
        # Ahora intentar login
        Write-Host "`n📋 3. Probando login con el admin..." -ForegroundColor Yellow
        
        $loginData = @{
            email = "admin@test.com"
            password = "123456789"
        }
        
        $loginResponse = Invoke-WebRequest -Uri "$serverUrl/login" -Method POST -Body ($loginData | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        
        Write-Host "Login Status Code: $($loginResponse.StatusCode)" -ForegroundColor Cyan
        $loginData = $loginResponse.Content | ConvertFrom-Json
        
        if ($loginData.success) {
            Write-Host "✅ Login exitoso!" -ForegroundColor Green
            Write-Host "Access Token recibido: $($loginData.data.accessToken -ne $null)" -ForegroundColor Cyan
        }
        
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        
        # Intentar leer el contenido del error usando diferentes métodos
        try {
            $errorContent = $_.ErrorDetails.Message
            if ($errorContent) {
                Write-Host "Error Content: $errorContent" -ForegroundColor Red
            }
        } catch {
            Write-Host "No se pudo leer el contenido del error detallado" -ForegroundColor Red
        }
    }
}

Write-Host "`n🏁 Setup completado." -ForegroundColor Green
