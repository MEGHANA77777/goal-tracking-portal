#!/bin/bash

echo "🚀 Goal Tracking Portal - Setup Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start Docker services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Navigate to API directory
cd apps/api

# Run Prisma migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database with demo data..."
npx prisma db seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Demo Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Admin:    admin@company.com / password123"
echo "Manager:  manager@company.com / password123"
echo "Employee: employee@company.com / password123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next steps:"
echo "1. Run 'npm run dev' to start the API server"
echo "2. API will be available at http://localhost:3001"
echo "3. Test with: curl http://localhost:3001/health"
echo ""
