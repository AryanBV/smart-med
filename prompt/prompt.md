# SMART-MED Phase 1: Project Initialization

## CONTEXT

You are initializing a healthcare PWA called "smart-med". This is Phase 1 of 6 phases. Phase 1 is ONLY about project setup - no features yet.

## TECH STACK (Exact Versions)

```
next: 15.1.x (latest 15.x)
react: 19.x
typescript: 5.x
tailwindcss: 4.x
@supabase/supabase-js: 2.x
@supabase/ssr: 0.5.x
next-pwa: 5.6.x
next-themes: 0.4.x
```

## EXISTING REPO STATE

The repo was created from GitHub with README.md and .gitignore (Node template).
- DELETE the existing README.md (we'll create a new one)
- KEEP the .gitignore but append Next.js specific entries

## PHASE 1 EXECUTION STEPS

Execute these steps IN ORDER. Do not skip ahead.

---

### STEP 1: Create CLAUDE.md

Create `CLAUDE.md` in the project root with this EXACT structure:

```markdown
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
- **Family Tree**: family-chart (D3-based)
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
1. Family tree with complex relationships
2. Document upload with OCR
3. Medicine extraction (GPT-4o-mini)
4. Drug interaction checking (OpenFDA)
5. Blood glucose tracking
6. Hierarchical access control

## Development Phases
- Phase 1: Foundation (Current) ✅
- Phase 2: Family Tree
- Phase 3: Document Upload & OCR
- Phase 4: Drug Interactions
- Phase 5: Glucose Tracking
- Phase 6: PWA Polish

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
```

**Verify**: File exists at `./CLAUDE.md`

---

### STEP 2: Initialize Next.js

Run this command and use THESE EXACT responses:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:
- "Ok to proceed?" → y
- If asked about overwriting files → y (overwrite all)

**Verify**: `package.json` exists with next dependency

---

### STEP 3: Install Additional Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr next-themes next-pwa
```

```bash
npm install -D @types/node
```

**Verify**: Run `npm list @supabase/supabase-js` shows installed

---

### STEP 4: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: yes

Then install ONLY these components (we'll add more as needed):

```bash
npx shadcn@latest add button card input label
```

**Verify**: `components.json` exists, `src/components/ui/button.tsx` exists

---

### STEP 5: Create Environment Files

Create `.env.local.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (for OCR pipeline)
OPENAI_API_KEY=your_openai_api_key
```

Update `.gitignore` to include:

```
# env files
.env*.local

# PWA
public/sw.js
public/workbox-*.js
```

**Verify**: Both files exist

---

### STEP 6: Configure Tailwind for Teal Primary

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 166 84% 29%;
    --primary: 175 84% 32%;
    --primary-foreground: 0 0% 100%;
    --muted: 174 30% 96%;
    --muted-foreground: 174 10% 40%;
    --border: 174 20% 90%;
    --ring: 175 84% 32%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 175 50% 5%;
    --foreground: 174 20% 95%;
    --primary: 174 72% 46%;
    --primary-foreground: 175 50% 5%;
    --muted: 175 30% 15%;
    --muted-foreground: 174 20% 65%;
    --border: 175 20% 20%;
    --ring: 174 72% 46%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

**Verify**: Files updated

---

### STEP 7: Create Supabase Client Files

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
```

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Verify**: All three files exist in `src/lib/`

---

### STEP 8: Create Layout Components

Create `src/components/layout/theme-toggle.tsx`:

```typescript
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

Install lucide-react:

```bash
npm install lucide-react
```

Create `src/components/layout/header.tsx`:

```typescript
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary-600">smart-med</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary-600">
            Dashboard
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary-600">
            Login
          </Link>
          <ThemeToggle />
        </nav>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

Create `src/components/layout/mobile-nav.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Pill, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
  { href: "/dashboard/medicines", label: "Meds", icon: Pill },
  { href: "/dashboard/glucose", label: "Glucose", icon: Activity },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px]",
                "text-muted-foreground hover:text-primary-600",
                isActive && "text-primary-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

Create `src/components/layout/providers.tsx`:

```typescript
"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

**Verify**: All four layout files exist

---

### STEP 9: Create Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "smart-med | Family Health Management",
  description: "Manage your family's health records, prescriptions, and medications in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "smart-med",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#042f2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Verify**: File updated

---

### STEP 10: Create Landing Page

Update `src/app/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-primary-600">
            smart-med
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your family's health records, prescriptions, and medications in one secure place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="min-h-[44px]">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-[44px]">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2026 smart-med. All rights reserved.
      </footer>
    </div>
  );
}
```

**Verify**: Landing page created

---

### STEP 11: Create Auth Pages

Create `src/app/(auth)/layout.tsx`:

```typescript
import { Header } from "@/components/layout/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
```

Create `src/app/(auth)/login/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="min-h-[44px]"
          />
        </div>
        <Button className="w-full min-h-[44px]" size="lg">
          Sign In
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full min-h-[44px]" size="lg">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
```

Create `src/app/(auth)/signup/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            className="min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="min-h-[44px]"
          />
        </div>
        <Button className="w-full min-h-[44px]" size="lg">
          Create Account
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full min-h-[44px]" size="lg">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
```

Install card component:

```bash
npx shadcn@latest add card
```

**Verify**: Auth pages created

---

### STEP 12: Create Dashboard Layout

Create `src/app/(dashboard)/layout.tsx`:

```typescript
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
```

Create `src/app/(dashboard)/page.tsx`:

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to smart-med. Your family health hub.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards - will be implemented in later phases */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Family Members</h3>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Documents</h3>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Active Medicines</h3>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Interactions</h3>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
      </div>
    </div>
  );
}
```

**Verify**: Dashboard pages created

---

### STEP 13: Create PWA Manifest

Create `public/manifest.json`:

```json
{
  "name": "smart-med",
  "short_name": "smart-med",
  "description": "Family health management app",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Create `public/icons/` directory and add placeholder note:

Create `public/icons/.gitkeep` (empty file to keep directory in git)

**Note**: Actual icons will be added later. For now, PWA will work without icons.

**Verify**: manifest.json exists

---

### STEP 14: Configure next.config.js

Replace `next.config.ts` with `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA configuration will be added in Phase 6
  // For now, keep it simple
};

module.exports = nextConfig;
```

Delete `next.config.ts` if it exists (we're using .js for PWA compatibility later).

**Verify**: next.config.js exists, next.config.ts does not

---

### STEP 15: Final Verification

Run these commands in sequence:

```bash
npm run build
```

If build succeeds, then:

```bash
npm run dev
```

Open browser and verify:
1. http://localhost:3000 → Landing page with header
2. http://localhost:3000/login → Login form
3. http://localhost:3000/signup → Signup form
4. http://localhost:3000/dashboard → Dashboard with mobile nav
5. Theme toggle works (click sun/moon icon)
6. Resize browser to mobile width → bottom nav appears

**Verify**: All pages load without errors

---

### STEP 16: Git Commit

```bash
git add .
git commit -m "Phase 1: Project initialization with Next.js 15, Tailwind, shadcn/ui, Supabase client"
git push origin main
```

**Verify**: Changes pushed to GitHub

---

## COMPLETION CRITERIA

Phase 1 is COMPLETE when ALL of these are true:

- [ ] CLAUDE.md exists in root
- [ ] `npm run dev` works without errors
- [ ] Landing page loads at /
- [ ] Login page loads at /login
- [ ] Signup page loads at /signup
- [ ] Dashboard page loads at /dashboard
- [ ] Theme toggle switches light/dark
- [ ] Mobile nav shows on screens < 768px
- [ ] Header shows on screens >= 768px
- [ ] No TypeScript errors
- [ ] Changes committed and pushed to GitHub

---

## DO NOT DO

- Do NOT implement actual authentication logic
- Do NOT create database tables
- Do NOT implement family tree
- Do NOT implement file upload
- Do NOT add more pages than specified
- Do NOT install packages not listed
- Do NOT use yarn or bun (use npm only)
- Do NOT create next.config.mjs (use .js)

---

## IF YOU ENCOUNTER ERRORS

1. **shadcn init fails**: Make sure Tailwind is configured first
2. **Module not found**: Run `npm install` again
3. **Type errors**: Check import paths use `@/` alias
4. **Build fails**: Read error message, fix the specific file
5. **Port 3000 in use**: Kill other processes or use `npm run dev -- -p 3001`

---

## ENVIRONMENT

- OS: Windows 11
- Terminal: PowerShell in VS Code
- Package Manager: npm (NOT yarn, NOT bun)
- Node: Latest LTS
- Existing .env.local: Already has Supabase keys

---

Execute steps 1-16 in order. Report completion status after each step.