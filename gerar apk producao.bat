@echo off
setlocal EnableExtensions
REM APK instalavel (producao) - API fixa na VPS (EAS + .env.production)
REM Perfil EAS: production-apk (buildType: apk)

cd /d "%~dp0"

set "PRODUCTION_API_URL=https://api-ordin.srv-jvt.com"
set "EXPO_PUBLIC_API_URL=%PRODUCTION_API_URL%"
set "EAS_BUILD_NO_EXPO_GO_WARNING=true"
set "CI=1"

REM Garante URL de producao no arquivo que o EAS le na nuvem
(
  echo # Gerado por gerar apk producao.bat — API de producao
  echo EXPO_PUBLIC_API_URL=%PRODUCTION_API_URL%
) > ".env.production"

echo.
echo ============================================================
echo  Ordin Flow - Build APK (producao)
echo ============================================================
echo  Pasta      : %CD%
echo  Perfil EAS : production-apk
echo  Saida      : arquivo .apk (instalacao direta)
echo  API        : %EXPO_PUBLIC_API_URL%
echo  eas.json   : env.EXPO_PUBLIC_API_URL (mesma URL)
echo  Painel     : https://expo.dev/accounts/zevitor/projects/ordin-flow/builds
echo ============================================================
echo.

echo [1/2] Validando projeto (expo-doctor)...
call npx expo-doctor
if errorlevel 1 (
  echo.
  echo AVISO: expo-doctor reportou problemas. O build pode continuar.
  echo.
)

echo [2/2] Iniciando EAS Build...
call npx eas-cli@latest build --platform android --profile production-apk --non-interactive
if errorlevel 1 goto erro

echo.
echo ============================================================
echo  Build enviado/concluido com sucesso.
echo  Baixe o APK no painel EAS (link acima) quando status = finished.
echo ============================================================
pause
exit /b 0

:erro
echo.
echo ============================================================
echo  ERRO no EAS Build
echo ============================================================
echo  1. Abra o painel: https://expo.dev/accounts/zevitor/projects/ordin-flow/builds
echo  2. Clique no build mais recente e veja a fase que falhou (ex.: Run gradlew)
echo  3. Corrija o erro e execute este .bat novamente
echo.
call npx eas-cli@latest build:list --platform android --limit 3 --non-interactive 2>nul
pause
exit /b 1
