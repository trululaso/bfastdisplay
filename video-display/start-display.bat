@echo off
rem Builds the app, serves it locally and opens Chrome full screen (kiosk mode).
rem Press Alt+F4 to close the kiosk window.
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run build
start "Video display server" /min cmd /c "npx vite preview --port 4173 --strictPort"
timeout /t 4 >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required --user-data-dir="%LOCALAPPDATA%\VideoDisplayKiosk" --no-first-run --disable-session-crashed-bubble "http://localhost:4173/"
