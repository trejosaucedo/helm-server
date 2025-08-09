import env from '#start/env'
import { EmailService } from '#services/email_service'

try {
  const apiKey = env.get('SENDGRID_API_KEY') as string | undefined
  if (apiKey && apiKey.length > 0) {
    EmailService.configure(apiKey)
    console.log('[EmailService] SendGrid configurado')
  } else {
    console.warn('[EmailService] SENDGRID_API_KEY no está definido; envío de correos deshabilitado')
  }
} catch (err) {
  console.error('[EmailService] Error configurando SendGrid:', err)
}


