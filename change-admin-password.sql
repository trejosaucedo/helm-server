-- TEMPORAL: Cambiar a contraseña en texto plano para testing
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

UPDATE users SET password = '123456789' WHERE email = 'admin@helmmining.com';

-- Verificar el cambio
SELECT id, email, role, password FROM users WHERE email = 'admin@helmmining.com';

-- Mostrar info del usuario
SELECT 
    id,
    email,
    role,
    created_at,
    updated_at
FROM users 
WHERE email = 'admin@helmmining.com';
