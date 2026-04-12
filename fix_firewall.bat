@echo off
echo ======================================================
echo CARDIAC MONITOR FIREWALL UNLOCKER
echo ======================================================
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [Status] Administrator rights confirmed!
) else (
    echo [ERROR] Please right-click this file and select "Run as administrator"
    pause
    exit
)

echo.
echo Removing old rules (if any)...
powershell -Command "Remove-NetFirewallRule -DisplayName 'Cardiac WebSocket' -ErrorAction SilentlyContinue"

echo Opening Port 8765 on ALL profiles (Public, Private, Domain)...
powershell -Command "New-NetFirewallRule -DisplayName 'Cardiac WebSocket' -Direction Inbound -LocalPort 8765 -Protocol TCP -Action Allow -Profile Any"

echo.
echo ======================================================
echo SUCCESS! Your firewall is now allowing the mobile app.
echo 1. Ensure your PC and Phone are on the EXACT SAME Wi-Fi network.
echo 2. Your PC IP is currently:
ipconfig | findstr "IPv4"
echo 3. Enter that IP above exactly into the App Settings.
echo ======================================================
pause
