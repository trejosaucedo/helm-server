import User from '#models/user'
import { Hash } from '@adonisjs/core/hash'

// Cambiar contraseña del admin
const user = await User.findByOrFail('email', 'admin@helmmining.com')
user.password = await Hash.make('123456789')
await user.save()
console.log('✅ Contraseña del admin actualizada!')
console.log('Email:', user.email)
console.log('Role:', user.role)
