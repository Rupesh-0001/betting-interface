# Betting Interface

A local betting interface built with Next.js that allows users to sign up via Google OAuth, receive 100 credits, and bet on binary outcomes. The pool is distributed among winners based on betting ratios.

## Features

- 🔐 Google OAuth authentication
- 💰 100 credits for new users
- 🎯 Binary betting (Option A vs Option B)
- 📊 Real-time pool tracking
- 🏆 Automatic payout distribution
- 📱 Responsive design

## Tech Stack

- **Frontend & Backend**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with class-variance-authority

## Setup Instructions

### Option 1: Docker Setup (Recommended)

#### Prerequisites

- Docker and Docker Compose installed

#### Quick Start

1. **Clone and navigate to the project:**

   ```bash
   cd betting-interface
   ```
2. **Create environment file:**

   ```bash
   cp .env.example .env
   ```
3. **Add your Google OAuth credentials to `.env`:**

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth Configuration  
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-change-in-production"

   # Google OAuth Configuration (Get these from Google Cloud Console)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
4. **Start the application:**

   ```bash
   docker-compose up --build
   ```
5. **Visit `http://localhost:3000`**

#### Development with Docker

- The container includes hot reloading for development
- Source code is mounted as a volume for real-time changes
- Database persists between container restarts

#### Production Docker Build

```bash
# Build production image
docker build -t betting-interface .

# Run production container
docker run -p 3000:3000 --env-file .env betting-interface
```

### Option 2: Local Setup (Requires Node.js 18.18+ or 20+)

#### 1. Environment Variables

Create a `.env` file in the root directory with the variables shown above.

#### 2. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add `http://localhost:3000` to authorized origins
6. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
7. Copy the Client ID and Client Secret to your `.env` file

#### 3. Install Dependencies

```bash
npm install
```

#### 4. Database Setup

```bash
npx prisma migrate dev --name init
npm run db:seed
```

#### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## How It Works

### User Flow

1. **Sign Up**: Users sign in with their Google account
2. **Credits**: New users automatically receive 100 credits
3. **Betting**: Users can bet on active rounds (Option A or B)
4. **Pool Distribution**: When a round is completed, the total pool is distributed among winners based on their betting ratio

### Betting Logic

- Each user can only bet once per round
- Bet amounts are deducted from user credits immediately
- Pool distribution formula: `userPayout = (userBet / winningPool) * totalPool`
- Winners receive their proportional share of the entire pool

### API Endpoints

- `GET /api/rounds` - Get all rounds
- `POST /api/rounds` - Create a new round
- `POST /api/bet` - Place a bet
- `POST /api/rounds/[id]/complete` - Complete a round and distribute winnings
- `GET /api/user/profile` - Get user profile and betting history

## Database Schema

### User

- Credits (default: 100)
- Google OAuth data
- Betting history

### Round

- Title and description
- Option A and Option B
- Status (ACTIVE, COMPLETED, CANCELLED)
- Pool totals for each option
- Winner designation

### Bet

- User and Round relationship
- Chosen option (A or B)
- Bet amount
- Payout (calculated after round completion)

## Development

### Docker Development Commands

```bash
# Start development environment
docker-compose up --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after major changes
docker-compose up --build --force-recreate

# Access container shell
docker-compose exec betting-interface sh

# Reset database in container
docker-compose exec betting-interface npx prisma migrate reset
docker-compose exec betting-interface npm run db:seed
```

### Adding New Features

1. **Database changes**: Update `prisma/schema.prisma` and run:

   - Local: `npx prisma migrate dev`
   - Docker: `docker-compose exec betting-interface npx prisma migrate dev`
2. **API routes**: Add to `src/app/api/`
3. **UI components**: Add to `src/components/ui/`
4. **Pages**: Add to `src/app/`

### Testing

The application includes seed data for testing. You can:

1. Sign in with Google
2. Place bets on the seeded rounds
3. Complete rounds to test payout distribution
4. Create new rounds to test the full flow

## Production Deployment

1. Set up a production database (PostgreSQL recommended)
2. Update environment variables for production
3. Configure Google OAuth for your production domain
4. Deploy to your preferred platform (Vercel, Railway, etc.)

## License

MIT License - feel free to use this project as a starting point for your own betting applications.
