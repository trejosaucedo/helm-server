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
