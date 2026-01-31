# Work For All

A community-first job platform designed specifically for homeless and underemployed individuals, connecting them with local employers offering accessible work opportunities.

## 🌟 Features

### For Workers
- **Simple Onboarding**: Start browsing jobs immediately without an account
- **Location-Based Matching**: Find jobs within walking/biking distance
- **Skills Profile**: Highlight your abilities to get matched with relevant jobs
- **Real-Time Notifications**: Get alerted when new matching jobs are posted
- **Reputation Building**: Collect reviews to build your work history

### For Employers
- **Quick Job Posting**: Post jobs in under a minute
- **Smart Matching**: Automatically find workers with relevant skills
- **Direct Messaging**: Communicate easily with applicants
- **Review System**: Leave feedback to help the community

### Technical Highlights
- 📱 Mobile-first, accessible design
- 🔄 Real-time messaging with Socket.io
- 🧠 Intelligent job-worker matching algorithm
- 🔒 Secure authentication with JWT
- 🤖 Teli AI voice integration ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Development Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd WorkForAll
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start PostgreSQL** (using Docker)
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Initialize database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   cd ..
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both:
   - Server: http://localhost:3000
   - Client: http://localhost:5173

### Production Deployment

Using Docker Compose:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The app will be available at http://localhost (port 80).

## 📁 Project Structure

```
WorkForAll/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── stores/        # Zustand state stores
│   │   ├── lib/           # API client, utilities
│   │   └── types/         # TypeScript types
│   └── Dockerfile
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, error handling
│   │   ├── services/      # Business logic
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── Dockerfile
│
├── docker-compose.yml      # Production deployment
├── docker-compose.dev.yml  # Development database
└── package.json            # Root workspace config
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/register` - Register account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/my` - List user's posted jobs

### Applications
- `POST /api/applications` - Apply to job
- `GET /api/applications/my` - List user's applications
- `PUT /api/applications/:id/status` - Update status
- `POST /api/applications/:id/complete` - Mark completed
- `DELETE /api/applications/:id` - Withdraw application

### Messages
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile

## 🧠 Matching Algorithm

The job-worker matching score is calculated using:

| Factor | Weight | Description |
|--------|--------|-------------|
| Skills | 40% | Percentage of required skills worker has |
| Distance | 35% | Based on travel distance vs max travel distance |
| Transportation | 25% | Transportation compatibility bonus |

## 🤖 Teli AI Integration

The platform is pre-configured for Teli AI voice agent integration:

1. Set environment variables:
   ```env
   TELI_ENABLED=true
   TELI_API_KEY=your-api-key
   TELI_AGENT_ID=your-agent-id
   ```

2. Teli will call workers when:
   - A new job matches their skills (score > 70%)
   - Their application status changes
   - They receive important notifications

3. Webhook endpoint: `POST /api/notifications/teli-webhook`

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configured for production
- Rate limiting on sensitive endpoints
- Input validation on all routes

## 📱 Mobile Support

The app is designed mobile-first with:
- Responsive Tailwind CSS design
- Touch-friendly UI elements
- Offline-capable PWA (future)
- SMS-based authentication option

## 🧪 Testing

```bash
# Run server tests
cd server && npm test

# Run client tests  
cd client && npm test

# Run all tests
npm test
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for the community
