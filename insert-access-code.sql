-- Insertar código de acceso para crear admin
INSERT INTO access_codes (email, code, created_at, updated_at) 
VALUES ('admin@test.com', 'VSKTKWF3', '2025-08-08 12:28:01', '2025-08-08 12:28:01')
ON DUPLICATE KEY UPDATE 
    code = 'VSKTKWF3', 
    updated_at = '2025-08-08 12:28:01';

-- Verificar que se insertó
SELECT * FROM access_codes WHERE email = 'admin@test.com';
