# 🧪 Debug del JWT
Write-Host "🧪 Analizando el JWT..." -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:3333"

try {
    # Login
    $loginData = @{
        email = "supervisor@helmmining.com"
        password = "supervisor1234"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    
    Write-Host "Token completo:" -ForegroundColor Yellow
    Write-Host $token
    Write-Host ""
    
    # Decodificar el JWT (sin verificar la firma)
    $parts = $token.Split('.')
    if ($parts.Length -eq 3) {
        $header = $parts[0]
        $payload = $parts[1]
        
        # Agregar padding si es necesario
        while ($payload.Length % 4 -ne 0) {
            $payload += "="
        }
        
        $payloadBytes = [System.Convert]::FromBase64String($payload)
        $payloadJson = [System.Text.Encoding]::UTF8.GetString($payloadBytes)
        
        Write-Host "Payload decodificado:" -ForegroundColor Green
        Write-Host $payloadJson
        Write-Host ""
        
        $payloadObj = $payloadJson | ConvertFrom-Json
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        
        Write-Host "Información del token:" -ForegroundColor Cyan
        Write-Host "- Usuario ID: $($payloadObj.userId)"
        Write-Host "- Email: $($payloadObj.email)"
        Write-Host "- Rol: $($payloadObj.role)"
        Write-Host "- Session ID: $($payloadObj.sessionId)"
        Write-Host "- Issued At: $($payloadObj.iat) ($(Get-Date -UnixTimeSeconds $payloadObj.iat))"
        Write-Host "- Expires At: $($payloadObj.exp) ($(Get-Date -UnixTimeSeconds $payloadObj.exp))"
        Write-Host "- Current Time: $now ($(Get-Date))"
        Write-Host "- Token válido por: $([Math]::Max(0, $payloadObj.exp - $now)) segundos"
        
        if ($payloadObj.exp -lt $now) {
            Write-Host "❌ TOKEN EXPIRADO!" -ForegroundColor Red
        } else {
            Write-Host "✅ Token aún válido" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
