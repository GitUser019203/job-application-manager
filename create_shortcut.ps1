$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Job Application Manager.lnk"
$CurrentDir = (Get-Location).Path
$TargetScript = Join-Path $CurrentDir "run.ps1"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$TargetScript`""
$Shortcut.WorkingDirectory = $CurrentDir
$Shortcut.IconLocation = "shell32.dll,3"
$Shortcut.Description = "Start Job Application Manager (Frontend + Backend)"
$Shortcut.Save()

Write-Host "Shortcut created successfully at: $ShortcutPath" -ForegroundColor Green
