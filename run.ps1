$currentPath = Get-Location
$venvScript = "$currentPath\.venv\Scripts\activate.ps1"

Write-Host "Starting Backend Server (with .venv) on Port 3001..." -ForegroundColor Cyan
# Start a new PowerShell process that activates venv and runs node
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { . '$venvScript'; node server.js }" -WorkingDirectory $currentPath -WindowStyle Minimized

Write-Host "Starting Frontend Application..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { serve -s build --ssl-cert '$currentPath\server.crt' --ssl-key '$currentPath\server.key' --listen 3000 }" -WorkingDirectory $currentPath

Write-Host "All services started!" -ForegroundColor Yellow