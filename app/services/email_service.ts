import sgMail from '@sendgrid/mail'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export class EmailService {
  static configure(apiKey: string) {
    sgMail.setApiKey(apiKey)
  }

  static getBrandLogoBase64(): string | null {
    try {
      const logoPath = join(process.cwd(), '..', 'public', 'favicon.ico')
      const data = readFileSync(logoPath)
      return `data:image/x-icon;base64,${data.toString('base64')}`
    } catch {
      return null
    }
  }

  static buildAccessCodeHtml(code: string): string {
    const logo = this.getBrandLogoBase64()
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Código de Acceso</title>
  <style>
    body { background:#0a192f; font-family:Arial,Helvetica,sans-serif; margin:0; padding:0; }
    .container { max-width:600px; margin:0 auto; padding:24px; }
    .card { background:linear-gradient(135deg,#112240,#0a192f); border:1px solid rgba(100,255,218,0.2); border-radius:16px; overflow:hidden; }
    .header { padding:24px; text-align:center; background:rgba(100,255,218,0.06); }
    .logo { width:48px; height:48px; border-radius:8px; display:inline-block; margin-bottom:12px; }
    .title { color:#e6f1ff; font-size:20px; margin:0; }
    .body { padding:24px; color:#a8b2d1; }
    .code { font-size:28px; font-weight:700; color:#0a192f; background:#64ffda; padding:12px 20px; border-radius:12px; display:inline-block; letter-spacing:2px; }
    .cta { margin-top:24px; }
    .btn { display:inline-block; padding:12px 20px; background:#64ffda; color:#0a192f; text-decoration:none; border-radius:10px; font-weight:700; }
    .footer { padding:16px 24px; font-size:12px; color:#8892b0; text-align:center; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          ${logo ? `<img class="logo" src="${logo}" alt="HELM" />` : ''}
          <h1 class="title">Tu código de acceso</h1>
        </div>
        <div class="body">
          <p>Usa el siguiente código para completar tu registro en HELM:</p>
          <p class="code">${code}</p>
          <p class="cta">Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} HELM. Todos los derechos reservados.</div>
      </div>
    </div>
  </body>
  </html>`
  }

  static buildTemporaryPasswordHtml(fullName: string, email: string, tempPassword: string): string {
    const logo = this.getBrandLogoBase64()
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu acceso a HELM</title>
  <style>
    body { background:#0a192f; font-family:Arial,Helvetica,sans-serif; margin:0; padding:0; }
    .container { max-width:600px; margin:0 auto; padding:24px; }
    .card { background:linear-gradient(135deg,#112240,#0a192f); border:1px solid rgba(100,255,218,0.2); border-radius:16px; overflow:hidden; }
    .header { padding:24px; text-align:center; background:rgba(100,255,218,0.06); }
    .logo { width:48px; height:48px; border-radius:8px; display:inline-block; margin-bottom:12px; }
    .title { color:#e6f1ff; font-size:20px; margin:0; }
    .body { padding:24px; color:#a8b2d1; }
    .row { margin:10px 0; }
    .label { color:#8892b0; font-size:12px; display:block; }
    .value { color:#e6f1ff; font-weight:700; font-size:16px; }
    .cta { margin-top:24px; }
    .btn { display:inline-block; padding:12px 20px; background:#64ffda; color:#0a192f; text-decoration:none; border-radius:10px; font-weight:700; }
    .footer { padding:16px 24px; font-size:12px; color:#8892b0; text-align:center; }
    .hint { font-size:12px; color:#8892b0; margin-top:12px; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          ${logo ? `<img class=\"logo\" src=\"${logo}\" alt=\"HELM\" />` : ''}
          <h1 class="title">Bienvenido a HELM</h1>
        </div>
        <div class="body">
          <p>Hola ${fullName || 'minero'}, tu cuenta ha sido creada por tu supervisor.</p>
          <div class="row">
            <span class="label">Correo</span>
            <span class="value">${email}</span>
          </div>
          <div class="row">
            <span class="label">Contraseña temporal</span>
            <span class="value">${tempPassword}</span>
          </div>
          <p class="hint">Inicia sesión con estos datos y cambia tu contraseña desde tu perfil cuando quieras.</p>
          <div class="cta">
            <a class="btn" href="${process.env.APP_URL || 'http://localhost:4200'}/login" target="_blank">Iniciar sesión</a>
          </div>
        </div>
        <div class="footer">© ${new Date().getFullYear()} HELM. Todos los derechos reservados.</div>
      </div>
    </div>
  </body>
  </html>`
  }

  static async sendTemporaryPasswordEmail(toEmail: string, fullName: string, tempPassword: string) {
    const html = this.buildTemporaryPasswordHtml(fullName, toEmail, tempPassword)
    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM || 'no-reply@helm.local',
      subject: 'HELM - Tu contraseña temporal',
      html,
    }
    await sgMail.send(msg)
  }

  static async sendAccessCodeEmail(toEmail: string, code: string) {
    const html = this.buildAccessCodeHtml(code)
    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM || 'no-reply@helm.local',
      subject: 'HELM - Tu código de acceso',
      html,
    }
    await sgMail.send(msg)
  }
}


