@echo off
color 0B
echo =======================================================
echo        INICIANDO PROYECTO LIDERIN (IONIC / ANGULAR)    
echo =======================================================
echo.
echo Verificando e instalando dependencias (por si acaso)...
call npm install

echo.
echo Levantando el servidor de desarrollo...
echo Por favor, no cierres esta ventana negra.
echo La aplicacion se abrira automaticamente en tu navegador en breves momentos.
echo.

call npm start -- -o

pause
