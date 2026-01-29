# SMART-MED

Family health management PWA with OCR-powered medicine extraction and drug interaction checking.

## Features

- **Family Tree**: Interactive visualization with parent/child/spouse/sibling relationships, zoom/pan navigation
- **Document OCR**: Upload prescriptions (JPG, PNG, WebP), automatic medicine extraction via GPT-4o-mini
- **Drug Interactions**: Hybrid checking using OpenFDA API + GPT fallback, severity levels (minor to contraindicated)
- **Glucose Tracking**: Log blood sugar readings with trend charts and statistics
- **PWA**: Installable progressive web app with offline support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (Postgres with RLS)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage (prescriptions bucket)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **OCR**: GPT-4o-mini (vision)
- **Drug Data**: OpenFDA API
- **Validation**: Zod schemas
- **Family Tree Layout**: relatives-tree

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-med
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in environment variables (see below)

5. Apply database migrations:
   ```bash
   npx supabase db push
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for OCR extraction |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your app URL (for OAuth callbacks) |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Protected dashboard pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── documents/          # Document management
│   ├── family/             # Family tree & members
│   ├── glucose/            # Glucose tracking
│   ├── interactions/       # Drug interactions
│   └── medicines/          # Medicine management
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── schemas/            # Zod validation schemas
│   └── utils.ts            # Utility functions
├── actions/                # Server Actions
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types
```

## Database Schema

8 tables with Row Level Security (RLS):
- `profiles` - User profiles
- `family_members` - Family member records
- `family_relationships` - Relationship links between members
- `documents` - Uploaded prescription documents
- `medicines` - Extracted medicines
- `drug_interactions` - Detected drug interactions
- `glucose_readings` - Blood sugar readings
- `access_permissions` - Hierarchical access (deferred)

## Security

- Row Level Security (RLS) on all tables
- UUID validation on all inputs
- Zod schema validation on forms
- Rate limiting on API routes (10 req/min for OCR)
- Ownership verification in server actions

## License

Private - All rights reserved
