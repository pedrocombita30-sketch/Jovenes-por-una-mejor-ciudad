@echo off
chcp 65001 >nul
title Reconstruir el panel (aplica los cambios de codigo)
cd /d "%~dp0"

echo ============================================================
echo   RECONSTRUIR EL PANEL
echo   Aplica los cambios que hiciste en el codigo.
echo ============================================================
echo.
echo   Si editaste archivos de texto de la base de datos
echo   ^(emails, contenido, notas^), el cambio ya esta
echo   aplicado y no necesitas esto.
echo.
echo   Solo hace falta despues de editar codigo: .jsx, .js, .css
echo.

pushd "%~dp0frontend"
call npm run build
set CODE=%ERRORLEVEL%
popd

echo.
if not "%CODE%"=="0" (
  echo   [ERROR] La compilacion fallo. Revisa los mensajes de arriba.
  echo   El sitio sigue mostrando la version anterior.
  pause
  exit /b 1
)

echo   Listo. Los cambios ya estan aplicados.
echo.
echo   Ahora solo recarga el navegador:  Ctrl + F5
echo.
pause
exit /b 0