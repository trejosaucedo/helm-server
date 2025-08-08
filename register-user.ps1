# Script para registrar un usuario supervisor que luego cambiarás a admin
Write-Host "👤 Registrando usuario supervisor..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

try {
    # Verificar servidor
    Write-Host "📋 1. Verificando servidor..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET
    
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Servidor funcionando" -ForegroundColor Green
        
        # Registrar supervisor
        Write-Host "`n📋 2. Registrando supervisor..." -ForegroundColor Yellow
        
        $userData = @{
            fullName = "Daniel Admin"
            email = "daniel@admin.com"
            password = "admin123456"
            codigo = "SUPER2024"
        }
        
        Write-Host "Datos a enviar:" -ForegroundColor Cyan
        Write-Host "  Email: $($userData.email)" -ForegroundColor White
        Write-Host "  Nombre: $($userData.fullName)" -ForegroundColor White
        Write-Host "  Código: $($userData.codigo)" -ForegroundColor White
        
        $response = Invoke-RestMethod -Uri "$serverUrl/register" -Method POST -Body ($userData | ConvertTo-Json) -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Usuario registrado exitosamente!" -ForegroundColor Green
            Write-Host "Usuario ID: $($response.data.user.id)" -ForegroundColor Cyan
            Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
            Write-Host "Rol actual: $($response.data.user.role)" -ForegroundColor Cyan
            Write-Host "Nombre: $($response.data.user.fullName)" -ForegroundColor Cyan
            
            $userId = $response.data.user.id
            
            Write-Host "`n📋 3. Probando login..." -ForegroundColor Yellow
            
            $loginData = @{
                email = $userData.email
                password = $userData.password
            }
            
            $loginResponse = Invoke-RestMethod -Uri "$serverUrl/login" -Method POST -Body ($loginData | ConvertTo-Json) -ContentType "application/json"
            
            if ($loginResponse.success) {
                Write-Host "✅ Login exitoso!" -ForegroundColor Green
                Write-Host "Access Token obtenido: ✓" -ForegroundColor Cyan
                
                Write-Host "`n🛠️ SIGUIENTE PASO:" -ForegroundColor Yellow
                Write-Host "Para cambiar el rol a admin, ejecuta este comando SQL en tu base de datos:" -ForegroundColor White
                Write-Host "UPDATE users SET role = 'admin' WHERE id = '$userId';" -ForegroundColor Cyan
                
                Write-Host "`nO usa este comando de AdonisJS:" -ForegroundColor White
                Write-Host "node ace tinker" -ForegroundColor Cyan
                Write-Host "Luego en el REPL:" -ForegroundColor Gray
                Write-Host "const User = (await import('#models/user')).default" -ForegroundColor Gray
                Write-Host "const user = await User.find('$userId')" -ForegroundColor Gray
                Write-Host "user.role = 'admin'" -ForegroundColor Gray
                Write-Host "await user.save()" -ForegroundColor Gray
                
                Write-Host "`n✅ Usuario creado con credenciales:" -ForegroundColor Green
                Write-Host "Email: $($userData.email)" -ForegroundColor White
                Write-Host "Password: $($userData.password)" -ForegroundColor White
                Write-Host "User ID: $userId" -ForegroundColor White
                
            } else {
                Write-Host "❌ Error en login: $($loginResponse.message)" -ForegroundColor Red
            }
            
        } else {
            Write-Host "❌ Error al registrar: $($response.message)" -ForegroundColor Red
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
            if ($errorData.data) {
                Write-Host "Datos adicionales: $($errorData.data)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n🏁 Script completado." -ForegroundColor Green
