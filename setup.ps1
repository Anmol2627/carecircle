# SafeCircle Backend Setup Script
# This script helps automate the setup process

Write-Host "🚀 SafeCircle Backend Setup" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check Supabase CLI
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseInstalled) {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Supabase CLI not installed. Installing..." -ForegroundColor Yellow
    npm install -g supabase
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
        Write-Host "Please run manually: npm install -g supabase" -ForegroundColor Yellow
    }
}

# Check for .env.local
Write-Host ""
Write-Host "Checking environment file..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found. Creating template..." -ForegroundColor Yellow
    @"
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "✅ Created .env.local template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env.local with your Supabase credentials!" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local with your Supabase credentials" -ForegroundColor White
Write-Host "2. Run: supabase login" -ForegroundColor White
Write-Host "3. Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
Write-Host "4. Run: supabase db push" -ForegroundColor White
Write-Host "5. Run: .\deploy-functions.ps1" -ForegroundColor White


