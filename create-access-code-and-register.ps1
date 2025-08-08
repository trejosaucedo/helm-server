# Script para crear código de acceso y luego registrar usuario
Write-Host "🔑 Creando código de acceso y registrando usuario..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

try {
    # Verificar servidor
    Write-Host "📋 1. Verificando servidor..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET
    
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Servidor funcionando" -ForegroundColor Green
        
        # Crear código de acceso
        Write-Host "`n📋 2. Creando código de acceso..." -ForegroundColor Yellow
        
        $emailData = @{
            email = "daniel@admin.com"
        }
        
        # Necesitamos un token de admin para crear códigos de acceso
        # Primero veamos qué endpoints están disponibles sin autenticación
        Write-Host "Probando endpoint de crear código de acceso..." -ForegroundColor Cyan
        
        try {
            $codeResponse = Invoke-RestMethod -Uri "$serverUrl/access-codes" -Method POST -Body ($emailData | ConvertTo-Json) -ContentType "application/json"
            
            if ($codeResponse.success) {
                Write-Host "✅ Código de acceso creado!" -ForegroundColor Green
                Write-Host "Código: $($codeResponse.data.code)" -ForegroundColor Cyan
                
                $accessCode = $codeResponse.data.code
                
                # Ahora registrar con el código válido
                Write-Host "`n📋 3. Registrando supervisor con código válido..." -ForegroundColor Yellow
                
                $userData = @{
                    fullName = "Daniel Admin"
                    email = "daniel@admin.com"
                    password = "admin123456"
                    codigo = $accessCode
                }
                
                $response = Invoke-RestMethod -Uri "$serverUrl/register" -Method POST -Body ($userData | ConvertTo-Json) -ContentType "application/json"
                
                if ($response.success) {
                    Write-Host "✅ Usuario registrado exitosamente!" -ForegroundColor Green
                    Write-Host "Usuario ID: $($response.data.user.id)" -ForegroundColor Cyan
                    Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
                    Write-Host "Rol actual: $($response.data.user.role)" -ForegroundColor Cyan
                    
                    $userId = $response.data.user.id
                    
                    Write-Host "`n🛠️ PARA CAMBIAR A ADMIN:" -ForegroundColor Yellow
                    Write-Host "Ejecuta en la base de datos:" -ForegroundColor White
                    Write-Host "UPDATE users SET role = 'admin' WHERE id = '$userId';" -ForegroundColor Cyan
                    
                    Write-Host "`n✅ Credenciales del usuario:" -ForegroundColor Green
                    Write-Host "Email: daniel@admin.com" -ForegroundColor White
                    Write-Host "Password: admin123456" -ForegroundColor White
                    Write-Host "User ID: $userId" -ForegroundColor White
                    
                } else {
                    Write-Host "❌ Error al registrar: $($response.message)" -ForegroundColor Red
                }
                
            } else {
                Write-Host "❌ Error al crear código: $($codeResponse.message)" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "❌ No se pudo crear código de acceso (requiere permisos de admin)" -ForegroundColor Red
            Write-Host "`n💡 ALTERNATIVA:" -ForegroundColor Yellow
            Write-Host "1. Crea el código manualmente en la base de datos:" -ForegroundColor White
            Write-Host "INSERT INTO access_codes (email, code, created_at, updated_at) VALUES ('daniel@admin.com', 'ADMIN123', NOW(), NOW());" -ForegroundColor Cyan
            Write-Host "`n2. Luego ejecuta:" -ForegroundColor White
            Write-Host ".\register-user-with-code.ps1" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "❌ Servidor no responde correctamente" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorData) {
            Write-Host "Detalle del error: $($errorData.message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🏁 Script completado." -ForegroundColor Green
