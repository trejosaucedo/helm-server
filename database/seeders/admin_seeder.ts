import User from '#models/user'

export default class AdminSeeder {
  public async run () {
    // Crear usuario Admin
    await User.firstOrCreate(
      { email: 'admin@helmmining.com' },
      {
        fullName: 'Administrador',
        email: 'admin@helmmining.com',
        password: 'admin1234',
        role: 'admin'
      }
    )

    // Crear usuario Supervisor
    await User.firstOrCreate(
      { email: 'supervisor@helmmining.com' },
      {
        fullName: 'Juan Supervisor',
        email: 'supervisor@helmmining.com',
        password: 'supervisor1234',
        role: 'supervisor'
      }
    )

    // Crear usuario Minero
    await User.firstOrCreate(
      { email: 'minero@helmmining.com' },
      {
        fullName: 'Carlos Minero',
        email: 'minero@helmmining.com',
        password: 'minero1234',
        role: 'minero',
        supervisorId: null // Se asignará cuando un supervisor lo registre
      }
    )
  }
}