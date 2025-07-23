 # 🧪 Debug completo de autenticación
Write-Host "🧪 Debug completo de la autenticación..." -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:3333"

try {
    # 1. Login
    $loginData = @{
        email = "supervisor@helmmining.com"
        password = "supervisor1234"
    } | ConvertTo-Json
    
    Write-Host "1. Haciendo login..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "✅ Login exitoso, token obtenido" -ForegroundColor Green
    
    # 2. Probar con diferentes formatos de headers
    Write-Host "`n2. Probando /me con diferentes configuraciones..." -ForegroundColor Yellow
    
    # Intento 1: Solo Authorization header
    Write-Host "Intento 1: Solo Authorization header" -ForegroundColor Gray
    try {
        $headers1 = @{ "Authorization" = "Bearer $token" }
        $response1 = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers $headers1
        Write-Host "✅ Éxito con headers básicos" -ForegroundColor Green
        Write-Host "Usuario: $($response1.data.fullName)" -ForegroundColor White
    } catch {
        Write-Host "❌ Falló con headers básicos: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Intento 2: Con Content-Type
    Write-Host "Intento 2: Con Content-Type" -ForegroundColor Gray
    try {
        $headers2 = @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $response2 = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers $headers2
        Write-Host "✅ Éxito con Content-Type" -ForegroundColor Green
        Write-Host "Usuario: $($response2.data.fullName)" -ForegroundColor White
    } catch {
        Write-Host "❌ Falló con Content-Type: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Intento 3: Con WebRequest para ver la respuesta completa
    Write-Host "Intento 3: Con WebRequest para detalles completos" -ForegroundColor Gray
    try {
        $webRequest = [System.Net.WebRequest]::Create("$baseUrl/me")
        $webRequest.Method = "GET"
        $webRequest.Headers.Add("Authorization", "Bearer $token")
        $webRequest.ContentType = "application/json"
        
        $response = $webRequest.GetResponse()
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        
        Write-Host "✅ WebRequest exitoso" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
        Write-Host "Response: $responseBody" -ForegroundColor White
        
        $reader.Close()
        $stream.Close()
        $response.Close()
    } catch {
        Write-Host "❌ WebRequest falló: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $errorReader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $errorReader.ReadToEnd()
            Write-Host "Error body: $errorBody" -ForegroundColor Red
        }
    }
    
    # Intento 4: Curl desde PowerShell
    Write-Host "Intento 4: Con curl" -ForegroundColor Gray
    try {
        $curlResult = & curl -s -X GET "$baseUrl/me" -H "Authorization: Bearer $token" -H "Content-Type: application/json"
        Write-Host "✅ Curl exitoso" -ForegroundColor Green
        Write-Host "Response: $curlResult" -ForegroundColor White
    } catch {
        Write-Host "❌ Curl falló: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error general: $($_.Exception.Message)" -ForegroundColor Red
}
