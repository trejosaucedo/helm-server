// app/services/auth_service.ts
import hash from '@adonisjs/core/services/hash'
import { UserRepository } from '#repositories/user_repository'
import type {
  LoginDto,
  AuthResponseDto,
  UserResponseDto,
  RegisterMineroDto,
  RegisterSupervisorDto,
} from '#dtos/auth'
import { CascoService } from '#services/casco_service'
import User from '#models/user'

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export class AuthService {
  private userRepository: UserRepository
  private cascoService: CascoService

  constructor() {
    this.userRepository = new UserRepository()
    this.cascoService = new CascoService()
  }

  async register(data: RegisterSupervisorDto): Promise<AuthResponseDto> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    const user = await this.userRepository.createSupervisor(data)
    const token = await user.generateToken()

    return {
      user: this.mapUserToResponse(user),
      token,
    }
  }

  async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(data.email)

    if (!user) {
      throw new Error('Credenciales inválidas')
    }

    const isValidPassword = await hash.verify(user.password, data.password)

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas')
    }

    const token = await user.generateToken()

    return {
      user: this.mapUserToResponse(user),
      token,
    }
  }

  async logout(tokenId: string, user: User): Promise<void> {
    await user.revokeToken(tokenId)
  }

  async logoutAll(user: User): Promise<void> {
    await user.revokeAllTokens()
  }

  async validateToken(tokenId: string): Promise<{ user: User } | null> {
    return await User.validateToken(tokenId)
  }

  async changePassword(user: User, data: ChangePasswordDto): Promise<void> {
    const isValidCurrentPassword = await hash.verify(user.password, data.currentPassword)

    if (!isValidCurrentPassword) {
      throw new Error('La contraseña actual es incorrecta')
    }

    user.password = data.newPassword
    await user.save()

    // Opcional: Revocar todas las sesiones activas por seguridad
    await user.revokeAllTokens()
  }

  private mapUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      cascoId: user.cascoId,
      createdAt: user.createdAt.toISO()!,
      updatedAt: user.updatedAt?.toISO() || null,
    }
  }

  async registerMinero(
    data: RegisterMineroDto
  ): Promise<{ user: UserResponseDto; temporaryPassword: string; message: string }> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    if (!data.cascoId) {
      throw new Error('El ID de casco es requerido para mineros')
    }

    const cascoExists = await this.cascoService.isCascoAvailable(data.cascoId)
    if (cascoExists) {
      throw new Error('El ID de casco ya está registrado')
    }

    const temporaryPassword = this.generateTemporaryPassword()

    const user = await this.userRepository.createMinero({
      ...data,
      password: temporaryPassword,
    })

    return {
      user: this.mapUserToResponse(user),
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
