@echo off
echo ===================================
echo  Nexpense EAS Build Setup
echo ===================================
echo.
echo 1. Bejelentkezés az Expo fiókba...
eas login
echo.
echo 2. EAS projekt létrehozása / összekapcsolása...
eas build:configure
echo.
echo 3. A kapott projectId-t add meg az app.config.ts fájlban:
echo    - Nyisd meg: apps/mobile/app.config.ts
echo    - Cseréld ki a 'REPLACE_WITH_YOUR_EAS_PROJECT_ID' szöveget
echo.
echo 4. Teszt build iOS szimulátorra (macOS esetén):
echo    eas build --profile development --platform ios
echo.
echo 5. Vagy fizikai eszközre (preview):
echo    eas build --profile preview --platform ios
echo.
pause
