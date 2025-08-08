$userData = @{
    fullName = "Admin User"
    email = "admin@test.com"
    password = "123456789"
    codigo = "VSKTKWF3"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/register" -Method POST -Body $userData -ContentType "application/json"
