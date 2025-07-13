// Script temporal para limpiar la tabla de cascos
import mysql from 'mysql2/promise';

async function cleanCascos() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'helm_iot'
  });

  try {
    // Limpiar tabla de cascos
    await connection.execute('DELETE FROM cascos');
    console.log('✅ Tabla cascos limpiada exitosamente');
    
    // Verificar que esté vacía
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM cascos');
    console.log(`📊 Registros en cascos: ${rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

cleanCascos();
