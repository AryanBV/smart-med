# SMART-MED

## Project Overview
Family health management PWA with OCR-powered medicine extraction and drug interaction checking.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (Postgres with RLS)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage
- **OCR**: GPT-4o-mini (vision)
- **Family Tree**: relatives-tree (layout calculation)
- **Validation**: Zod schemas
- **PWA**: next-pwa

## Design System
- **Primary Color**: Teal (teal-600: #0D9488)
- **Approach**: Mobile-first, responsive
- **Theme**: Light + Dark (system preference)
- **Min Touch Target**: 44x44px
- **Min Body Text**: 16px

## Project Structure
```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth pages (login, signup)
│   ├── (dashboard)/  # Protected pages
│   └── api/          # API routes
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── documents/    # Document management
│   ├── family/       # Family tree & members
│   ├── glucose/      # Glucose tracking
│   ├── interactions/ # Drug interactions
│   └── medicines/    # Medicine management
├── lib/
│   ├── supabase/     # Supabase clients
│   ├── schemas/      # Zod validation schemas
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
├── actions/          # Server Actions
└── types/            # TypeScript types
```

## Key Features
1. ~~Family tree with complex relationships~~ ✅
2. ~~Document upload with OCR~~ ✅
3. ~~Medicine extraction (GPT-4o-mini)~~ ✅
4. ~~Drug interaction checking (OpenFDA)~~ ✅
5. ~~Blood glucose tracking~~ ✅
6. ~~PWA with offline support~~ ✅
7. Hierarchical access control - Deferred (table exists, not integrated)

### Family Tree (Phase 3B) ✅
- Interactive family tree visualization with zoom/pan
- Relationship management (parent, child, spouse, sibling)
- Add/delete relationships between family members
- Visual connectors showing relationships
- Mobile-friendly with touch support

### Document Management (Phase 4A) ✅
- Upload documents (JPG, PNG, WebP) up to 10MB
- Drag-and-drop upload interface
- Document list with pagination
- View documents via signed URLs
- Delete documents with confirmation
- OCR status tracking (pending → processed)
- Documents linked to family members
- **Note**: PDF upload disabled until extraction support is added

### Medicine Extraction (Phase 4B) ✅
- GPT-4o-mini vision for prescription OCR
- Automatic medicine name, dosage, frequency extraction
- Indian prescription format support (Tab., BD, TDS, etc.)
- Medicine cards with active/inactive toggle
- Delete medicines with confirmation
- Medicines page showing all family medications
- Document status updates (pending → processing → completed/failed)

### Drug Interactions (Phase 5) ✅
- Hybrid interaction checking (OpenFDA + GPT fallback)
- Severity levels: minor, moderate, major, contraindicated
- Auto-check when medicines extracted
- Dashboard alert for unacknowledged interactions
- Interaction cards with acknowledge/dismiss
- Medical disclaimer on all interaction information
- Interactions page showing all warnings

### Glucose Tracking (Phase 6) ✅
- Log blood sugar readings with family member selection
- Reading types: fasting, pre-meal, post-meal, random, bedtime
- Meal context tracking (breakfast, lunch, dinner, snack)
- Color-coded values based on glucose ranges
- Statistics: average, fasting average, range, in-target percentage
- Trend chart showing last 30 readings
- Delete readings with confirmation

### PWA (Phase 7) ✅
- Service worker with next-pwa
- Offline fallback page
- Installable on mobile devices

## Security Features
- Row Level Security (RLS) on all 8 database tables
- UUID validation on all inputs
- Zod schema validation on forms
- Rate limiting on API routes (10 req/min for document processing)
- Ownership verification in all server actions

## Development Phases
- Phase 1: Foundation ✅
- Phase 2A: Database Schema ✅
- Phase 2B: Authentication ✅
- Phase 3A: Family Member CRUD ✅
- Phase 3B: Family Tree Visualization ✅
- Phase 4A: Document Upload & Storage ✅
- Phase 4B: OCR & Medicine Extraction ✅
- Phase 5: Drug Interactions ✅
- Phase 6: Glucose Tracking ✅
- Phase 7: PWA Polish ✅

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables
Required in `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- NEXT_PUBLIC_SITE_URL

## Known Limitations
- PDF extraction not yet supported (images only)
- access_permissions table exists but not yet integrated in application layer
- Middleware deprecation warning in Next.js 16 (proxy convention)
