@echo off
echo Iniciando SGConfi Inspector...
start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"
echo Listo. Backend: http://localhost:3001 - Frontend: http://localhost:5173
