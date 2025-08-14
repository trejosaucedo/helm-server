import AccessCode from '#models/access_code'
import { DateTime } from 'luxon'

export class AccessCodeRepository {
  async findValidCode(codigo: string, correoSupervisor: string) {
    const normalized = (correoSupervisor || '').trim().toLowerCase()
    return AccessCode.query()
      .where('codigo', codigo)
      .andWhereRaw('LOWER(correo_supervisor) = ?', [normalized])
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
      correo_supervisor: (correoSupervisor || '').trim().toLowerCase(),
      usado: false,
      fecha_generacion: DateTime.now(),
    })
    console.log('AccessCodeRepository: Código creado en BD:', result.id)
    return result
  }

  async getCodesByEmail(email: string) {
    const normalized = (email || '').trim().toLowerCase()
    return await AccessCode.query().whereRaw('LOWER(correo_supervisor) = ?', [normalized])
  }

  async getCodeByEmail(email: string) {
    const normalized = (email || '').trim().toLowerCase()
    return await AccessCode.query().whereRaw('LOWER(correo_supervisor) = ?', [normalized]).orderBy('fecha_generacion', 'desc').first()
  }

  async getAllCodes() {
    return await AccessCode.query().orderBy('fecha_generacion', 'desc')
  }

  async deleteUnusedByCode(code: string): Promise<number> {
    // Elimina solo si no ha sido usado
    const result = await AccessCode.query().where('codigo', code).andWhere('usado', false).delete()
    // Lucid .delete() devuelve número de filas afectadas
    return Number(result as unknown as number)
  }
}
