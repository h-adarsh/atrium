#!/bin/sh
set -e

echo "🔒 Atrium Container Starting..."

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "📦 Applying database schema migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
else
  echo "📦 Syncing database schema to PostgreSQL (prisma db push)..."
  npx prisma db push --skip-generate
fi

if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "🌱 SEED_ON_STARTUP=true detected. Seeding initial apartment & multi-society data..."
  npm run prisma:seed || true
fi

echo "🚀 Starting Node server..."
exec "$@"
