import hash from '@adonisjs/core/services/hash'
import { UserRepository } from '#repositories/user_repository'
import { CascoRepository } from '#repositories/casco_repository'
import { SessionService } from '#services/session_service'
import type {
  LoginDto,
  UserResponseDto,
  RegisterMineroDto,
  RegisterSupervisorDto,
  ChangePasswordDto,
} from '#dtos/user.dto'
import User from '#models/user'
import { toUserResponseDto } from '#mappers/user.mapper'
import { AccessCodeRepository } from '#repositories/acces_code_repository'

export class AuthService {
  private userRepository: UserRepository
  private cascoRepository: CascoRepository
  private codeRepo: AccessCodeRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.cascoRepository = new CascoRepository()
    this.codeRepo = new AccessCodeRepository()
  }

  async register(data: RegisterSupervisorDto): Promise<{
    user: UserResponseDto
    accessToken: string
    sessionId: string
  }> {
    // 1. Validar que el email no exista
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    // 2. Validar código de acceso (AccessCode)
    const code = await this.codeRepo.findValidCode(data.codigo, data.email)
    if (!code) {
      throw new Error('Código de acceso inválido o ya usado')
    }

    // 3. Crear usuario
    const user = await this.userRepository.createSupervisor(data)
    // 4. Marcar el código como usado
    await this.codeRepo.markCodeAsUsed(code.id)

    // 5. Crear sesión y devolver info
    const tokens = await SessionService.createSession(user)
    return {
      user: toUserResponseDto(user),
      accessToken: tokens.accessToken,
      sessionId: tokens.sessionId,
    }
  }

  async login(data: LoginDto): Promise<{
    user: UserResponseDto
    accessToken: string
    sessionId: string
  }> {
    const user = await this.userRepository.findByEmail(data.email)
    if (!user) {
      throw new Error('Credenciales inválidas')
    }

    // Usar el hash configurado en withAuthFinder
    const isValidPassword = await hash.verify(user.password, data.password)
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas')
    }

    const tokens = await SessionService.createSession(user)

    return {
      user: toUserResponseDto(user),
      accessToken: tokens.accessToken,
      sessionId: tokens.sessionId,
    }
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await SessionService.revokeSession(userId, sessionId)
  }

  async logoutAll(userId: string): Promise<void> {
    await SessionService.revokeAllSessions(userId)
  }

  async validateAccessToken(accessToken: string): Promise<{ user: User } | null> {
    const result = await SessionService.validateAccessToken(accessToken)
    return result ? { user: result.user } : null
  }

  async validateSession(sessionId: string): Promise<User | null> {
    return await SessionService.validateSession(sessionId)
  }

  async refreshToken(sessionId: string): Promise<string | null> {
    return await SessionService.refreshAccessToken(sessionId)
  }

  async getActiveSessions(userId: string) {
    return await SessionService.getActiveSessions(userId)
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await SessionService.revokeSession(userId, sessionId)
  }

  async changePassword(user: User, data: ChangePasswordDto): Promise<void> {
    const isValidCurrentPassword = await hash.verify(user.password, data.currentPassword)
    if (!isValidCurrentPassword) {
      throw new Error('La contraseña actual es incorrecta')
    }

    user.password = data.newPassword
    await user.save()

    // Revoca todas las sesiones por seguridad (usa SessionService)
    await SessionService.revokeAllSessions(user.id)
  }

  async registerMinero(
    data: RegisterMineroDto,
    supervisorId: string
  ): Promise<{ user: UserResponseDto; temporaryPassword: string; message: string }> {
    // 1. Validar que el email no esté registrado
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    // 2. Validar y asignar casco solo si se proporciona cascoId
    let casco = null
    if (data.cascoId) {
      // Buscar el casco por ID
      casco = await this.cascoRepository.findById(data.cascoId)
      if (!casco) throw new Error('El casco no existe')
      if (casco.supervisorId !== supervisorId)
        throw new Error('El casco no pertenece a este supervisor')
      if (casco.mineroId) throw new Error('El casco ya está asignado a otro minero')
      if (!casco.asignadoSupervisor) throw new Error('El casco no está activado para supervisión')
      if (casco.asignadoMinero) throw new Error('El casco ya está asignado a un minero')
    }

    // 3. Generar contraseña temporal
    const temporaryPassword = this.generateTemporaryPassword()

    // 4. Construir el payload SOLO con los campos que aplican
    const mineroPayload: any = {
      fullName: data.fullName,
      email: data.email,
      password: temporaryPassword,
      role: 'minero',
      supervisorId,
      fechaContratacion: data.fechaContratacion ?? null,
      especialidadEnMineria: data.especialidadEnMineria ?? null,
      genero: data.genero ?? null,
    }

    if (data.cascoId) {
      mineroPayload.cascoId = data.cascoId
    }

    // 5. Crear el usuario minero
    const user = await this.userRepository.createMinero(mineroPayload)

    // 6. Si se asignó casco, actualizar el casco para referenciar al nuevo minero
    if (casco) {
      await this.cascoRepository.assignToMinero(casco.id, user.id)
    }

    // 7. Retornar respuesta estructurada
    return {
      user: toUserResponseDto(user),
      temporaryPassword,
      message: 'Minero registrado exitosamente',
    }
  }

  private generateTemporaryPassword(): string {
    const length = 12
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }
}
