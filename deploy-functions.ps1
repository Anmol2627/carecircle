# Deploy all Edge Functions to Supabase
# Make sure you're logged in and linked first!

Write-Host "🚀 Deploying SafeCircle Edge Functions" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase connection..." -ForegroundColor Yellow
$projects = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connected to Supabase" -ForegroundColor Green
Write-Host ""

# Deploy functions
$functions = @(
    "trigger-sos",
    "respond-to-incident",
    "resolve-incident",
    "award-points",
    "check-in-timer"
)

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Yellow
    supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "✅ All functions deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "Don't forget to:" -ForegroundColor Cyan
Write-Host "1. Set environment variables in Supabase Dashboard → Edge Functions → Settings" -ForegroundColor White
Write-Host "2. Enable Realtime for messages, incident_helpers, user_locations" -ForegroundColor White
Write-Host "3. Set up cron job for expired timers" -ForegroundColor White


