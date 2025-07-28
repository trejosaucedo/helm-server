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
    await AccessCode.query()
      .where('id', id)
      .update({
        usado: true,
        fecha_uso: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      })
  }

  async create(codigo: string, correoSupervisor: string) {
    console.log('AccessCodeRepository: Creando código:', codigo, 'para email:', correoSupervisor)
    const result = await AccessCode.create({
      codigo,
      correo_supervisor: correoSupervisor,
      usado: false,
      fecha_generacion: DateTime.now(),
    })
    console.log('AccessCodeRepository: Código creado en BD:', result.id)
    return result
  }

  async getCodesByEmail(email: string) {
    return await AccessCode.query().where('correo_supervisor', email)
  }

  async getCodeByEmail(email: string) {
    return await AccessCode.query().where('correo_supervisor', email).orderBy('fecha_generacion', 'desc').first()
  }

  async getAllCodes() {
    return await AccessCode.query().orderBy('fecha_generacion', 'desc')
  }
}
