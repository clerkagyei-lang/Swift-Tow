$env:HOME = $env:USERPROFILE
$env:EXPO_PUBLIC_API_URL = "https://your-api.railway.app"

Set-Location -Path "artifacts/mobile"

Write-Host "Starting Expo dev server with tunnel..." -ForegroundColor Cyan
npx expo start --tunnel --port 8081
