# Test simplificado para debuggear
$baseUrl = "http://127.0.0.1:3333"

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@helmmining.com","password":"admin1234"}'
$token = $loginResponse.data.accessToken
Write-Host "Token: $token"

# 2. Crear casco
$cascoResponse = Invoke-RestMethod -Uri "$baseUrl/cascos" -Method POST -ContentType "application/json" -Headers @{Authorization = "Bearer $token"} -Body '{"physicalId":"CASCO-DEBUG-001"}'
Write-Host "Casco response:"
$cascoResponse | ConvertTo-Json

$cascoId = $cascoResponse.data.id
Write-Host "Casco ID: $cascoId"

# 3. Obtener sensores
$sensoresResponse = Invoke-RestMethod -Uri "$baseUrl/sensors/casco/$cascoId" -Method GET -Headers @{Authorization = "Bearer $token"}
Write-Host "Sensores response:"
$sensoresResponse | ConvertTo-Json
