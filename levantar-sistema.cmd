@echo off
chcp 65001 >nul
title Jovenes por una Mejor Ciudad - Inicio unico
cd /d "%~dp0"
cls
echo ============================================================
echo   JOVENES POR UNA MEJOR CIUDAD - Inicio de un solo paso
echo ============================================================
echo.

if not exist "%~dp0backend\src" goto sin_carpeta
if not exist "%~dp0frontend\src" goto sin_carpeta

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] Node.js no esta instalado en este equipo.
  echo   Descargalo en https://nodejs.org ^(version LTS^) y repite.
  echo.
  pause
  exit /b 1
)

echo [1/4] Verificando dependencias...
rem OneDrive puede dejar archivos "solo en la nube" y vaciar carpetas.
rem Por eso se comprueba un archivo clave, no solo que exista la carpeta.
if not exist "%~dp0backend\node_modules\.bin\prisma.cmd" (
  echo        Instalando dependencias del servidor ^(puede tardar un poco^)...
  pushd "%~dp0backend"
  call npm install
  popd
)
if not exist "%~dp0frontend\node_modules\.bin\vite.cmd" (
  echo        Instalando dependencias del panel...
  pushd "%~dp0frontend"
  call npm install
  popd
)
echo        Ok.

echo [2/4] Compilando el panel...
rem Se compila siempre: si el build es viejo, el sitio muestra la version anterior.
pushd "%~dp0frontend"
call npm run build
popd
echo        Ok.

echo [3/4] Abriendo el servidor en http://localhost:3001 ...
if exist "%~dp0backend\.env" (
  start "JMC Servidor - 3001" /D "%~dp0backend" cmd /k "npm start"
) else (
  echo        [AVISO] No existe backend\.env - se crea con valores por defecto...
  pushd "%~dp0backend"
  node scripts\crear-env.js
  popd
  start "JMC Servidor - 3001" /D "%~dp0backend" cmd /k "npm start"
)

echo [4/4] Abriendo el navegador...
timeout /t 4 /nobreak >nul
start "" "http://localhost:3001"
echo.
echo ============================================================
echo   LISTO.
echo.
echo   En ESTE equipo:        http://localhost:3001
echo.
set "IPTMP=%TEMP%\jmc-ip-%RANDOM%.txt"
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress" > "%IPTMP%" 2>nul
set /p LANIP=< "%IPTMP%"
del "%IPTMP%" >nul 2>nul
if defined LANIP (
  echo   Desde otros dispositivos en la misma red:
  echo        http://%LANIP%:3001
) else (
  echo   Desde otros dispositivos: usa el IP de este equipo, puerto 3001
)
echo.
echo   Panel admin: http://localhost:3001/login
echo       (usa tu cuenta de administrador; si no tienes una, crea una con backend\crear-usuario.js)
echo.
echo   NO cierres la ventana del servidor.
echo   Este aviso se cierra solo en 20 segundos.
echo ============================================================
echo.
timeout /t 20 /nobreak >nul
exit /b 0

:sin_carpeta
echo   [ERROR] No se encuentra la carpeta del proyecto completa.
echo.
echo   Este archivo debe estar DENTRO de la carpeta del proyecto,
echo   junto a las carpetas  backend  y  frontend.
echo.
echo   Si moviste solo este archivo a otra carpeta, vuelve a
echo   copiarlo dentro de "Default Project".
echo.
pause
exit /b 1