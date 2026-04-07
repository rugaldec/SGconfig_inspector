@echo off
chcp 65001 >nul
title SGConfi Inspector

echo ================================================
echo   SGConfi Inspector - Iniciando aplicacion
echo ================================================
echo.

REM Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo desde: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar que PostgreSQL esté corriendo
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo [AVISO] PostgreSQL no responde en localhost:5432
    echo Asegurate de que el servicio PostgreSQL este iniciado.
    echo Panel de control ^> Servicios ^> postgresql-x64-XX ^> Iniciar
    echo.
    pause
)

REM Instalar dependencias si faltan
echo [1/4] Verificando dependencias del backend...
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo      Instalando dependencias backend...
    call npm install
)

echo [2/4] Verificando dependencias del frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo      Instalando dependencias frontend...
    call npm install
)

REM Ejecutar migraciones
echo [3/4] Aplicando migraciones de base de datos...
cd /d "%~dp0backend"
call npm run db:migrate -- --name init >nul 2>&1
if errorlevel 1 (
    echo [AVISO] No se pudo migrar la base de datos.
    echo Verifica que PostgreSQL este corriendo y las credenciales en backend\.env sean correctas.
    echo.
)

REM Lanzar backend y frontend en ventanas separadas
echo [4/4] Iniciando servidores...
echo.

start "SGConfi - Backend  (puerto 3001)" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 >nul
start "SGConfi - Frontend (puerto 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ================================================
echo   Listo. Abre tu navegador en:
echo   http://localhost:5173
echo ================================================
echo.
echo Cierra las ventanas de Backend y Frontend para detener.
echo.
pause
