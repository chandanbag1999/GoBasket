# GoBasket Application Test Script
Write-Host "=== GoBasket Application Test Script ===" -ForegroundColor Cyan

# Test Backend
Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Backend is running on port 5000" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | Format-List
} catch {
    Write-Host "✗ Backend is not running or not accessible" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test API Endpoint
Write-Host "`n2. Testing API Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1" -Method GET -ErrorAction Stop
    Write-Host "✓ API v1 endpoint is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ API endpoint is not accessible" -ForegroundColor Red
}

# Test Categories Endpoint
Write-Host "`n3. Testing Categories Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/categories" -Method GET -ErrorAction Stop
    Write-Host "✓ Categories endpoint is working" -ForegroundColor Green
} catch {
    Write-Host "✗ Categories endpoint error" -ForegroundColor Red
}

# Test Frontend
Write-Host "`n4. Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -ErrorAction Stop
    Write-Host "✓ Frontend is running on port 5173" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend is not running" -ForegroundColor Red
}

Write-Host "`n=== Configuration Summary ===" -ForegroundColor Cyan
Write-Host "Backend URL: http://localhost:5000" -ForegroundColor White
Write-Host "API Base URL: http://localhost:5000/api/v1" -ForegroundColor White
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor White

Write-Host "`n=== Key Fixes Applied ===" -ForegroundColor Cyan
Write-Host "1. Fixed API base URL from port 3001 to 5000" -ForegroundColor White
Write-Host "2. Fixed WebSocket URL from port 3001 to 5000" -ForegroundColor White
Write-Host "3. Fixed auth endpoints (/auth/me, /auth/addresses)" -ForegroundColor White
Write-Host "4. Fixed categories endpoint (/categories not /products/categories)" -ForegroundColor White
Write-Host "5. Fixed CORS CLIENT_URL to port 5173" -ForegroundColor White
Write-Host "6. Fixed address API methods (PUT not PATCH)" -ForegroundColor White

Write-Host "`n=== Common Issues to Check ===" -ForegroundColor Cyan
Write-Host "1. MongoDB should be running on localhost:27017" -ForegroundColor Yellow
Write-Host "2. Redis connection is configured (check logs)" -ForegroundColor Yellow
Write-Host "3. Environment variables are properly set" -ForegroundColor Yellow
Write-Host "4. Both frontend and backend are started" -ForegroundColor Yellow

Write-Host "`n=== How to Start ===" -ForegroundColor Cyan
Write-Host "Backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "Frontend: cd frontend && npm run dev" -ForegroundColor White
