import Casco from '#models/casco'
import User from '#models/user'

export default class CascoSeeder {
  public async run() {
    // Obtener un supervisor para asignar a los cascos
    const supervisor = await User.query().where('role', 'supervisor').first()
    
    // Crear un casco de prueba
    const cascoData = {
      physicalId: 'CASCO-SEEDER-001',
      serial: 'CASCO-SEEDER-001',
      isActive: true,
      supervisorId: supervisor?.id || null,
    }

    await Casco.firstOrCreate(
      { physicalId: cascoData.physicalId },
      cascoData
    )

    console.log('✅ Cascos seeder completed')
  }
}
