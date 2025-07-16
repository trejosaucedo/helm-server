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
    await AccessCode.query().where('id', id).update({
      usado: true,
      fecha_uso: DateTime.now(),
    })
  }
}
