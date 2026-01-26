# SMART-MED

## Project Overview
Family health management PWA with OCR-powered medicine extraction and drug interaction checking.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage
- **OCR**: Tesseract.js + GPT-4o-mini
- **Family Tree**: relatives-tree (layout calculation)
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
│   └── layout/       # Layout components
├── lib/
│   ├── supabase/     # Supabase clients
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
├── actions/          # Server Actions
└── types/            # TypeScript types
```

## Key Features (To Be Implemented)
1. ~~Family tree with complex relationships~~ ✅
2. ~~Document upload with OCR~~ ✅ (Upload complete, OCR in Phase 4B)
3. Medicine extraction (GPT-4o-mini)
4. Drug interaction checking (OpenFDA)
5. Blood glucose tracking
6. Hierarchical access control

### Family Tree (Phase 3B) ✅
- Interactive family tree visualization with zoom/pan
- Relationship management (parent, child, spouse, sibling)
- Add/delete relationships between family members
- Visual connectors showing relationships
- Mobile-friendly with touch support

### Document Management (Phase 4A) ✅
- Upload documents (JPG, PNG, WebP, PDF) up to 10MB
- Drag-and-drop upload interface
- Document list with file preview icons
- View documents via signed URLs
- Delete documents with confirmation
- OCR status tracking (pending → processed)
- Documents linked to family members

## Development Phases
- Phase 1: Foundation ✅
- Phase 2A: Database Schema ✅
- Phase 2B: Authentication ✅
- Phase 3A: Family Member CRUD ✅
- Phase 3B: Family Tree Visualization ✅
- Phase 4A: Document Upload & Storage ✅
- Phase 4B: OCR Text Extraction
- Phase 5: Drug Interactions
- Phase 6: Glucose Tracking
- Phase 7: PWA Polish

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Environment Variables
Required in `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
