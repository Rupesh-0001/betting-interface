#!/bin/bash

echo "🎯 Setting up Betting Interface with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"

# Google OAuth Configuration (Get these from Google Cloud Console)
GOOGLE_CLIENT_ID="client_id"
GOOGLE_CLIENT_SECRET="client_secret"
EOL
    echo "✅ Created .env file. Please add your Google OAuth credentials!"
else
    echo "✅ .env file already exists"
fi

# Build and start the containers
echo "🏗️  Building and starting Docker containers..."
docker-compose up --build -d

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your Google OAuth credentials to the .env file"
echo "2. Visit http://localhost:3000 to see your betting interface"
echo ""
echo "🐳 Docker commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop: docker-compose down"
echo "- Restart: docker-compose restart"
echo ""
echo "🔧 Configure Google OAuth:"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create OAuth 2.0 Client ID"
echo "3. Add http://localhost:3000 to authorized origins"
echo "4. Add http://localhost:3000/api/auth/callback/google to redirect URIs"
echo "5. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env" 