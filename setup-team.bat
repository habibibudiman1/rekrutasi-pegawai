@echo off
echo ========================================
echo   Setup Proyek Rekrutasi Pegawai
echo   Untuk Tim - Menggunakan Supabase Sama
echo ========================================
echo.

REM Cek apakah Node.js terinstall
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Membuat file konfigurasi frontend...
if not exist "frontend\js\supabase-init.js" (
    copy "frontend\js\supabase-init-template.js" "frontend\js\supabase-init.js" >nul
    echo    File frontend\js\supabase-init.js berhasil dibuat dari template
) else (
    echo    File frontend\js\supabase-init.js sudah ada
)

REM Update konfigurasi Supabase di file yang baru dibuat
powershell -Command "(Get-Content 'frontend\js\supabase-init.js') -replace 'masukan ini dengan url supabase anda', 'https://zibabfofuubjkgpvhstm.supabase.co' | Set-Content 'frontend\js\supabase-init.js'"
powershell -Command "(Get-Content 'frontend\js\supabase-init.js') -replace 'masukan ini dengan anon key supabase anda', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI' | Set-Content 'frontend\js\supabase-init.js'"
echo    Konfigurasi Supabase sudah diupdate

echo.
echo [2/4] Membuat file konfigurasi backend...
if not exist "backend\config\config.js" (
    copy "backend\config\config.template.js" "backend\config\config.js" >nul
    echo    File backend\config\config.js berhasil dibuat dari template
) else (
    echo    File backend\config\config.js sudah ada
)

REM Update konfigurasi Supabase di file backend
powershell -Command "(Get-Content 'backend\config\config.js') -replace 'YOUR_SUPABASE_URL_HERE', 'https://zibabfofuubjkgpvhstm.supabase.co' | Set-Content 'backend\config\config.js'"
powershell -Command "(Get-Content 'backend\config\config.js') -replace 'YOUR_SUPABASE_ANON_KEY_HERE', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI' | Set-Content 'backend\config\config.js'"
echo    Konfigurasi Supabase sudah diupdate

echo.
echo [3/4] Menginstall dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal menginstall dependencies!
    pause
    exit /b 1
)

echo.
echo [4/4] Setup selesai!
echo.
echo ========================================
echo   Setup Berhasil!
echo ========================================
echo.
echo Langkah selanjutnya:
echo 1. Pastikan database sudah di-setup di Supabase Dashboard
echo 2. Pastikan storage bucket 'applications' sudah dibuat
echo 3. Jalankan aplikasi dengan: npm run dev
echo 4. Buka browser: http://localhost:3000
echo.
echo Untuk panduan lengkap, baca file SETUP_TEAM.md
echo.
pause
