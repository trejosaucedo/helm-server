-- Cambiar contraseña del admin existente
-- Nota: Necesitarás hashear la contraseña con el mismo método que usa AdonisJS

-- Opción 1: Si puedes usar AdonisJS para hashear
-- En tinker: Hash.make('123456789')

-- Opción 2: Contraseña temporal sin hashear (NO RECOMENDADO PARA PRODUCCIÓN)
-- UPDATE users SET password = '123456789' WHERE email = 'admin@helmmining.com';

-- Opción 3: Verificar el usuario actual
SELECT id, email, role, created_at FROM users WHERE email = 'admin@helmmining.com';
