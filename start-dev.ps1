# PowerShell script to start the development server
Write-Host "Starting Timetable Ace Development Server..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\THE-MAY-BE-FINAL-main"
npm run dev

