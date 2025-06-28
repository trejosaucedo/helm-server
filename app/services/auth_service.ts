import hash from '@adonisjs/core/services/hash'
import { UserRepository } from '#repositories/user_repository'
import { CascoRepository } from '#repositories/casco_repository'
import type {
  LoginDto,
  AuthResponseDto,
  UserResponseDto,
  RegisterMineroDto,
  RegisterSupervisorDto,
  ChangePasswordDto,
} from '#dtos/auth'
import User from '#models/user'

export class AuthService {
  private userRepository: UserRepository
  private cascoRepository: CascoRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.cascoRepository = new CascoRepository()
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

    await user.revokeAllTokens()
  }

  async registerMinero(
    data: RegisterMineroDto,
    supervisorId: string
  ): Promise<{ user: UserResponseDto; temporaryPassword: string; message: string }> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    // Verificar que el casco existe y pertenece al supervisor
    const casco = await this.cascoRepository.findById(data.cascoId)
    if (!casco) {
      throw new Error('El casco no existe')
    }

    if (casco.supervisorId !== supervisorId) {
      throw new Error('El casco no pertenece a este supervisor')
    }

    if (casco.mineroId) {
      throw new Error('El casco ya está asignado a otro minero')
    }

    if (!casco.isActive) {
      throw new Error('El casco no está activo')
    }

    const temporaryPassword = this.generateTemporaryPassword()

    const user = await this.userRepository.createMinero({
      ...data,
      password: temporaryPassword,
    })

    // Asignar el casco al minero
    await this.cascoRepository.assignToMinero(casco.id, user.id)

    return {
      user: this.mapUserToResponse(user),
      temporaryPassword,
      message: 'Minero registrado exitosamente',
    }
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
