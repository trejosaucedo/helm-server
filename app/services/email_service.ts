export class EmailService {
  async sendTemporaryPassword(
    email: string,
    temporaryPassword: string,
    fullName?: string
  ): Promise<void> {
    //simulado

    console.log('=== EMAIL SIMULADO ===')
    console.log(`Para: ${email}`)
    console.log(`Asunto: Bienvenido al Sistema de Minas`)
    console.log(`Mensaje:`)
    console.log(`Hola ${fullName || 'Usuario'},`)
    console.log(``)
    console.log(`Tu cuenta ha sido creada exitosamente.`)
    console.log(``)
    console.log(`Credenciales de acceso:`)
    console.log(`Email: ${email}`)
    console.log(`Contraseña temporal: ${temporaryPassword}`)
    console.log(``)
    console.log(`Por favor, cambia tu contraseña después del primer login.`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Minas`)
    console.log('=====================')

    // await mail.send('emails/temporary-password', { email, temporaryPassword, fullName })

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    console.log('=== EMAIL RESET PASSWORD ===')
    console.log(`Para: ${email}`)
    console.log(`Token de reset: ${resetToken}`)
    console.log('============================')

    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
