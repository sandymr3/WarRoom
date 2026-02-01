# KK's War Room - Entrepreneurial Assessment Platform

A comprehensive Next.js 16 application for assessing entrepreneurial competencies through adaptive questioning, real-time state tracking, and AI-powered personalized insights.

## 🎯 Overview

The War Room is a full-stack entrepreneurial assessment platform that evaluates 16 core competencies across 6 business stages, providing:
- **150+ adaptive questions** spanning pre-launch through growth stages
- **Real-time consequence simulation** tracking financial, team, and customer metrics
- **AI-powered analysis** generating personalized development roadmaps
- **2 attempts** with learning journey and improvement tracking
- **Professional reports** with competency visualization and actionable insights

## 🏗️ Project Structure

```
kk-war-room/
├── app/                          # Next.js 16 app router
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx
│   ├── assessment/
│   │   ├── [assessmentId]/page.tsx       # Main assessment UI
│   │   ├── [assessmentId]/stage-report/page.tsx
│   │   └── [assessmentId]/final-report/page.tsx
│   ├── admin/
│   │   ├── cohorts/page.tsx
│   │   └── reports/page.tsx
│   └── api/                     # API routes (placeholder)
├── src/
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── assessment/
│   │   │   ├── question-renderer.tsx
│   │   │   ├── open-text-question.tsx
│   │   │   ├── multiple-choice-question.tsx
│   │   │   ├── scenario-question.tsx
│   │   │   ├── budget-allocation-question.tsx
│   │   │   └── state-dashboard.tsx
│   │   └── reports/
│   │       └── competency-card.tsx
│   ├── lib/
│   │   ├── data/
│   │   │   ├── sample-questions.ts
│   │   │   └── sample-state.ts
│   │   ├── hooks/
│   │   │   └── use-assessment.ts
│   │   └── services/
│   │       └── placeholder-service.ts
│   ├── types/
│   │   ├── question.ts
│   │   ├── assessment.ts
│   │   ├── state.ts
│   │   └── report.ts
│   └── stores/                  # Zustand stores (placeholder)
└── public/
    └── images/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install:**
```bash
git clone <repo>
cd kk-war-room
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open in browser:**
```
http://localhost:3000
```

## 📋 Key Features

### 1. Authentication
- Email/Password login and registration
- Google OAuth integration (placeholder)
- Protected routes with middleware

### 2. Assessment Engine
- **Question Types:**
  - Open text responses
  - Multiple choice
  - Scenarios with context
  - Budget allocation exercises
  
- **Adaptive Logic:**
  - Stage-based progression (-2 to 3)
  - Real-time state tracking
  - Consequence simulation

### 3. Real-Time State Dashboard
Tracks and displays:
- Financial metrics (capital, revenue, burn, runway)
- Team metrics (size, satisfaction)
- Customer metrics (total, retention)
- Active mistakes and risk indicators
- Time remaining

### 4. Reporting System
- **Phase-End Reports:** After each stage
- **Final Reports:** Comprehensive assessment analysis
- **Comparison Reports:** Attempt 1 vs Attempt 2
- Export capabilities (PDF, email, share)

### 5. Admin Interface
- Cohort management
- Report generation
- Participant tracking
- Export and analytics

## 🎨 Design System

**Colors:**
- Primary: `#2563EB` (Blue)
- Secondary: `#7C3AED` (Purple)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)

**Typography:**
- Font: Geist (sans-serif)
- Mono: Geist Mono
- Spacing: Tailwind scale (4, 8, 16, 24, 32)

**Components:** Shadcn/ui with Tailwind CSS v4

## 🔧 Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript 5+
- Tailwind CSS v4
- Shadcn/ui components
- Lucide React icons

### State Management
- React Hooks (Client-side)
- Zustand (for complex state - optional)

### Data & Persistence (Placeholder)
- Placeholder services for backend integration
- Ready for Prisma/Drizzle ORM
- Database schema defined

### AI Integration (Placeholder)
- OpenAI API integration pattern
- Vercel AI SDK support
- Response evaluation pipeline

## 📝 Next Steps - Implement

### 1. **Database Setup**
```bash
# Install Prisma
npm install @prisma/client
npm install -D prisma

# Initialize
npx prisma init

# Use schema from PRD at src/lib/db/schema.prisma
npx prisma migrate dev --name init
```

### 2. **Authentication Implementation**
```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

### 3. **API Routes**
Implement in `app/api/`:
- `/auth/[...nextauth]` - NextAuth routes
- `/assessments` - CRUD operations
- `/assessments/[id]/next-question` - Question flow
- `/assessments/[id]/submit-answer` - Response submission
- `/ai/evaluate-text` - AI evaluation
- `/reports/[assessmentId]/final` - Report generation

### 4. **Services Implementation**
Update `src/lib/services/`:
- `question-engine.ts` - Adaptive questioning logic
- `state-manager.ts` - State tracking and updates
- `ai-evaluator.ts` - OpenAI integration
- `consequence-engine.ts` - Mistake impact calculation
- `report-generator.ts` - Report compilation

### 5. **Environment Variables**
Create `.env.local`:
```
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=your-postgres-url

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI
OPENAI_API_KEY=your-openai-key
```

## 🧪 Sample Data

Mock questions and state available in:
- `/src/lib/data/sample-questions.ts`
- `/src/lib/data/sample-state.ts`

Used by `/src/lib/hooks/use-assessment.ts` for demo functionality.

## 📊 Assessment Structure

### 6 Stages
- **Stage -2:** Ideation & Problem Finding
- **Stage -1:** Pre-MVP Validation
- **Stage 0:** MVP & Market Entry
- **Stage 1:** Early Growth (Survival)
- **Stage 2:** Scale & Optimization
- **Stage 3:** Market Leadership

### 16 Core Competencies
Grouped by category:
- **Discovery:** Problem Sensing, Market Understanding
- **Communication:** Value Articulation, Customer Empathy
- **Execution:** Resource Planning, Financial Acumen, Team Building
- **Resilience:** Adaptability, Learning Agility
- **Decision Making:** Risk Assessment, Strategic Vision
- **Operations:** Customer Retention, Execution Excellence
- **Innovation:** Product Development
- **Growth:** Market Expansion, Stakeholder Alignment

## 🔐 Security Considerations

- [ ] Password hashing with bcryptjs
- [ ] Secure session management
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] CSRF protection
- [ ] Row-Level Security (RLS) for database
- [ ] Input validation and sanitization
- [ ] Environment variable management

## 📚 Component Documentation

### Question Renderer Components
- `question-renderer.tsx` - Main dispatcher
- `open-text-question.tsx` - Text input with character count
- `multiple-choice-question.tsx` - Radio selection with warnings
- `scenario-question.tsx` - Context + options
- `budget-allocation-question.tsx` - Slider-based allocation

### Dashboard Component
- `state-dashboard.tsx` - Real-time metrics display with visual indicators

### Report Components
- `competency-card.tsx` - Score display with expandable evidence

## 🚢 Deployment

### Deploy to Vercel
```bash
git push origin main
# Automatically deploys to production

# Set environment variables in Vercel dashboard
```

### Self-Hosted
- Docker image available (add Dockerfile)
- Deploy to AWS, GCP, or Azure
- Configure database connection

## 📖 API Documentation (Placeholder)

See `/src/lib/services/placeholder-service.ts` for implementation stubs.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Submit pull request

## 📄 License

Proprietary - KK's War Room

## 🆘 Support

For issues and questions:
- Open a GitHub issue
- Contact: support@warroom.kk
- Docs: https://docs.warroom.kk

---

**Created with v0** | Built for serious entrepreneurs
