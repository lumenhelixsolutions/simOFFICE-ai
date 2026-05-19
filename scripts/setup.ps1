Write-Host "Installing SimOffice client dependencies..."
npm --prefix client install

Write-Host "Creating Python virtual environment..."
python -m venv backend/.venv

Write-Host "Installing backend dependencies..."
& backend/.venv/Scripts/pip.exe install -r backend/requirements.txt

if (!(Test-Path backend/.env)) {
  Copy-Item backend/.env.example backend/.env
  Write-Host "Created backend/.env. Add your API keys before running real agents."
}

if (!(Test-Path client/.env.local)) {
  Copy-Item client/.env.example client/.env.local
  Write-Host "Created client/.env.local."
}

Write-Host "SimOffice setup complete."
