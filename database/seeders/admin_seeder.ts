import User from '#models/user'

export default class AdminSeeder {
  public async run() {
    await User.firstOrCreate(
      { email: 'admin@gmail.com' },
      {
        fullName: 'Administrador',
        email: 'admin@gmail.com',
        password: 'admin1234',
        role: 'admin',
        phone: '0000000000',
        rfc: 'ADMIN000000',
        address: 'HQ',
        birthDate: '1980-01-01',
      }
    )

    // Crear usuario Supervisor
    await User.firstOrCreate(
      { email: 'supervisor@gmail.com' },
      {
        fullName: 'Juan Supervisor',
        email: 'supervisor@gmail.com',
        password: 'supervisor1234',
        role: 'supervisor',
        phone: '1111111111',
        rfc: 'SUP000000',
        address: 'Zona A',
        birthDate: '1985-05-10',
      }
    )

    // Crear usuario Minero
    await User.firstOrCreate(
      { email: 'minero@gmail.com' },
      {
        fullName: 'Carlos Minero',
        email: 'minero@gmail.com',
        password: 'minero1234',
        role: 'minero',
        supervisorId: null,
        phone: '2222222222',
        rfc: 'MIN000000',
        address: 'Zona B',
        birthDate: '1990-09-20',
      }
    )
  }
}
