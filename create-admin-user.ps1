# Script para crear usuario y luego cambiarlo a admin
Write-Host "👤 Creando usuario para convertir en admin..." -ForegroundColor Green

$serverUrl = "http://localhost:3333"

try {
    # 1. Crear código de acceso para poder registrarse
    Write-Host "📋 1. Creando código de acceso..." -ForegroundColor Yellow
    
    $emailData = @{
        email = "admin@test.com"
    } | ConvertTo-Json
    
    $codeResponse = Invoke-RestMethod -Uri "$serverUrl/access-codes" -Method POST -Body $emailData -ContentType "application/json"
    
    if ($codeResponse.success) {
        Write-Host "✅ Código de acceso creado exitosamente!" -ForegroundColor Green
        Write-Host "Código: $($codeResponse.data.code)" -ForegroundColor Cyan
        $codigo = $codeResponse.data.code
        
        # 2. Registrar usuario supervisor con el código
        Write-Host "`n📋 2. Registrando usuario supervisor..." -ForegroundColor Yellow
        
        $userData = @{
            fullName = "Admin User"
            email = "admin@test.com"
            password = "123456789"
            codigo = $codigo
        } | ConvertTo-Json
        
        $registerResponse = Invoke-RestMethod -Uri "$serverUrl/register" -Method POST -Body $userData -ContentType "application/json"
        
        if ($registerResponse.success) {
            Write-Host "✅ Usuario registrado exitosamente!" -ForegroundColor Green
            Write-Host "ID: $($registerResponse.data.user.id)" -ForegroundColor Cyan
            Write-Host "Email: $($registerResponse.data.user.email)" -ForegroundColor Cyan
            Write-Host "Role actual: $($registerResponse.data.user.role)" -ForegroundColor Cyan
            
            $userId = $registerResponse.data.user.id
            
            Write-Host "`n📋 3. Ahora necesitas cambiar el rol a 'admin' manualmente..." -ForegroundColor Yellow
            Write-Host "Puedes usar uno de estos métodos:" -ForegroundColor White
            
            Write-Host "`n🔧 OPCIÓN 1 - MySQL Directo:" -ForegroundColor Cyan
            Write-Host "UPDATE users SET role = 'admin' WHERE id = '$userId';" -ForegroundColor Gray
            
            Write-Host "`n🔧 OPCIÓN 2 - AdonisJS Tinker:" -ForegroundColor Cyan
            Write-Host "node ace tinker" -ForegroundColor Gray
            Write-Host "const user = await User.find('$userId')" -ForegroundColor Gray
            Write-Host "user.role = 'admin'" -ForegroundColor Gray
            Write-Host "await user.save()" -ForegroundColor Gray
            
            Write-Host "`n🔧 OPCIÓN 3 - Crear script SQL:" -ForegroundColor Cyan
            $sqlScript = @"
UPDATE users SET role = 'admin' WHERE id = '$userId';
SELECT id, email, role FROM users WHERE id = '$userId';
"@
            Set-Content -Path "update-admin-role.sql" -Value $sqlScript
            Write-Host "✅ Archivo 'update-admin-role.sql' creado" -ForegroundColor Green
            Write-Host "Ejecuta: mysql -u tu_usuario -p tu_database < update-admin-role.sql" -ForegroundColor Gray
            
            Write-Host "`n📋 4. Después de cambiar el rol, prueba el login:" -ForegroundColor Yellow
            Write-Host "POST $serverUrl/login" -ForegroundColor Gray
            Write-Host '{"email":"admin@test.com","password":"123456789"}' -ForegroundColor Gray
            
        } else {
            Write-Host "❌ Error al registrar usuario: $($registerResponse.message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Error al crear código de acceso: $($codeResponse.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Detalles: $($errorDetails.message)" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Proceso completado. Cambia el rol manualmente y luego podrás hacer login como admin." -ForegroundColor Green
