#!/bin/bash

echo "========================================"
echo "  Setup Proyek Rekrutasi Pegawai"
echo "  Untuk Tim - Menggunakan Supabase Sama"
echo "========================================"
echo ""

# Cek apakah Node.js terinstall
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak ditemukan!"
    echo "Silakan install Node.js terlebih dahulu dari https://nodejs.org"
    exit 1
fi

echo "[1/4] Membuat file konfigurasi frontend..."
if [ ! -f "frontend/js/supabase-init.js" ]; then
    cp "frontend/js/supabase-init-template.js" "frontend/js/supabase-init.js"
    echo "   File frontend/js/supabase-init.js berhasil dibuat dari template"
else
    echo "   File frontend/js/supabase-init.js sudah ada"
fi

# Update konfigurasi Supabase
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's|masukan ini dengan url supabase anda|https://zibabfofuubjkgpvhstm.supabase.co|g' "frontend/js/supabase-init.js"
    sed -i '' 's|masukan ini dengan anon key supabase anda|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI|g' "frontend/js/supabase-init.js"
else
    # Linux
    sed -i 's|masukan ini dengan url supabase anda|https://zibabfofuubjkgpvhstm.supabase.co|g' "frontend/js/supabase-init.js"
    sed -i 's|masukan ini dengan anon key supabase anda|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI|g' "frontend/js/supabase-init.js"
fi
echo "   Konfigurasi Supabase sudah diupdate"

echo ""
echo "[2/4] Membuat file konfigurasi backend..."
if [ ! -f "backend/config/config.js" ]; then
    cp "backend/config/config.template.js" "backend/config/config.js"
    echo "   File backend/config/config.js berhasil dibuat dari template"
else
    echo "   File backend/config/config.js sudah ada"
fi

# Update konfigurasi Supabase di file backend
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's|YOUR_SUPABASE_URL_HERE|https://zibabfofuubjkgpvhstm.supabase.co|g' "backend/config/config.js"
    sed -i '' 's|YOUR_SUPABASE_ANON_KEY_HERE|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI|g' "backend/config/config.js"
else
    # Linux
    sed -i 's|YOUR_SUPABASE_URL_HERE|https://zibabfofuubjkgpvhstm.supabase.co|g' "backend/config/config.js"
    sed -i 's|YOUR_SUPABASE_ANON_KEY_HERE|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI|g' "backend/config/config.js"
fi
echo "   Konfigurasi Supabase sudah diupdate"

echo ""
echo "[3/4] Menginstall dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Gagal menginstall dependencies!"
    exit 1
fi

echo ""
echo "[4/4] Setup selesai!"
echo ""
echo "========================================"
echo "  Setup Berhasil!"
echo "========================================"
echo ""
echo "Langkah selanjutnya:"
echo "1. Pastikan database sudah di-setup di Supabase Dashboard"
echo "2. Pastikan storage bucket 'applications' sudah dibuat"
echo "3. Jalankan aplikasi dengan: npm run dev"
echo "4. Buka browser: http://localhost:3000"
echo ""
echo "Untuk panduan lengkap, baca file SETUP_TEAM.md"
echo ""

