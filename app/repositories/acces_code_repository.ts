import AccessCode from '#models/access_code'
import { DateTime } from 'luxon'

export class AccessCodeRepository {
  async findValidCode(codigo: string, correoSupervisor: string) {
    return AccessCode.query()
      .where('codigo', codigo)
      .andWhere('correo_supervisor', correoSupervisor)
      .andWhere('usado', false)
      .first()
  }

  async markCodeAsUsed(id: string) {
    // Usar consulta SQL directa para evitar problemas con zonas horarias
    await AccessCode.query()
      .where('id', id)
      .update({
        usado: true,
        fecha_uso: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      })
  }

  async create(codigo: string, correoSupervisor: string) {
    return AccessCode.create({
      codigo,
      correoSupervisor,
      usado: false,
      fechaGeneracion: DateTime.now(),
    })
  }
}
