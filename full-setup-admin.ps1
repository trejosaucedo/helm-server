# Script para insertar código de acceso directamente en la DB y registrar usuario
Write-Host "🔧 Creando código de acceso en la base de datos..." -ForegroundColor Green

try {
    # Vamos a usar node para ejecutar una consulta directa
    Write-Host "📋 1. Insertando código de acceso en la base de datos..." -ForegroundColor Yellow
    
    $nodeScript = @"
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

async function createAccessCode() {
  try {
    // Leer variables de entorno desde .env
    const envContent = readFileSync('.env', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    });
    
    const connection = await mysql.createConnection({
      host: envVars.DB_HOST || 'localhost',
      user: envVars.DB_USER || 'root',
      password: envVars.DB_PASSWORD || '',
      database: envVars.DB_DATABASE || 'helm_db'
    });
    
    // Insertar código de acceso
    const [result] = await connection.execute(
      'INSERT INTO access_codes (email, code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      ['daniel@admin.com', 'ADMIN123']
    );
    
    console.log('✅ Código de acceso creado exitosamente');
    console.log('Email: daniel@admin.com');
    console.log('Código: ADMIN123');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAccessCode();
"@
    
    # Guardar script temporal
    $nodeScript | Out-File -FilePath "temp_create_code.mjs" -Encoding utf8
    
    # Ejecutar script
    Write-Host "Ejecutando script de base de datos..." -ForegroundColor Cyan
    node temp_create_code.mjs
    
    # Limpiar archivo temporal
    Remove-Item "temp_create_code.mjs" -ErrorAction SilentlyContinue
    
    # Ahora registrar el usuario
    Write-Host "`n📋 2. Registrando usuario con código creado..." -ForegroundColor Yellow
    
    $serverUrl = "http://localhost:3333"
    
    $userData = @{
        fullName = "Daniel Admin"
        email = "daniel@admin.com"
        password = "admin123456"
        codigo = "ADMIN123"
    }
    
    $response = Invoke-RestMethod -Uri "$serverUrl/register" -Method POST -Body ($userData | ConvertTo-Json) -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Usuario registrado exitosamente!" -ForegroundColor Green
        Write-Host "Usuario ID: $($response.data.user.id)" -ForegroundColor Cyan
        Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
        Write-Host "Rol actual: $($response.data.user.role)" -ForegroundColor Cyan
        
        $userId = $response.data.user.id
        
        Write-Host "`n📋 3. Probando login..." -ForegroundColor Yellow
        
        $loginData = @{
            email = $userData.email
            password = $userData.password
        }
        
        $loginResponse = Invoke-RestMethod -Uri "$serverUrl/login" -Method POST -Body ($loginData | ConvertTo-Json) -ContentType "application/json"
        
        if ($loginResponse.success) {
            Write-Host "✅ Login exitoso!" -ForegroundColor Green
            
            Write-Host "`n🛠️ AHORA CAMBIA EL ROL A ADMIN:" -ForegroundColor Yellow
            Write-Host "Opción 1 - SQL directo:" -ForegroundColor White
            Write-Host "UPDATE users SET role = 'admin' WHERE id = '$userId';" -ForegroundColor Cyan
            
            Write-Host "`nOpción 2 - Script Node:" -ForegroundColor White
            Write-Host "Ejecuta: .\change-user-to-admin.ps1 $userId" -ForegroundColor Cyan
            
            Write-Host "`n✅ CREDENCIALES DEL USUARIO:" -ForegroundColor Green
            Write-Host "Email: daniel@admin.com" -ForegroundColor White
            Write-Host "Password: admin123456" -ForegroundColor White
            Write-Host "User ID: $userId" -ForegroundColor White
            
        } else {
            Write-Host "❌ Error en login: $($loginResponse.message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Error al registrar: $($response.message)" -ForegroundColor Red
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
