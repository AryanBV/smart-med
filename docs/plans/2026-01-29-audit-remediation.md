# Smart-Med Audit Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical security vulnerabilities, bugs, and code quality issues identified in the comprehensive audit.

**Architecture:** Address issues in priority order - security first, then bugs, then code quality. Each task is atomic and can be tested independently.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Tailwind CSS

---

## Phase 1: Critical Security Fixes (MUST DO BEFORE PRODUCTION)

### Task 1: Fix Storage Bucket Name Mismatch

**Priority:** 🔴 CRITICAL - All file operations are broken

**Files:**
- Modify: `src/actions/documents.ts` (lines 162, 195)
- Modify: `src/components/documents/document-upload-dialog.tsx` (lines 128, 151)
- Modify: `src/app/api/documents/[id]/process/route.ts` (lines 77, 82, 107, 134, 160)

**Step 1: Update documents.ts**

Replace all instances of `"documents"` with `"prescriptions"`:

```typescript
// Line 162 - In deleteDocument function
const { error: storageError } = await supabase.storage
  .from("prescriptions")  // Changed from "documents"
  .remove([doc.file_path]);

// Line 195 - In getSignedUrl function
const { data } = await supabase.storage
  .from("prescriptions")  // Changed from "documents"
  .createSignedUrl(filePath, 3600);
```

**Step 2: Update document-upload-dialog.tsx**

```typescript
// Line 128
const { error: uploadError } = await supabase.storage
  .from("prescriptions")  // Changed from "documents"
  .upload(filePath, file);

// Line 151
const { error: deleteError } = await supabase.storage
  .from("prescriptions")  // Changed from "documents"
  .remove([filePath]);
```

**Step 3: Update process/route.ts**

```typescript
// Lines 77, 82, 107, 134, 160 - All storage references
.from("prescriptions")  // Changed from "documents"
```

**Step 4: Test**

1. Upload a new document - should succeed
2. View document - should load
3. Delete document - should remove from storage
4. Process document for OCR - should access file

**Step 5: Commit**

```bash
git add src/actions/documents.ts src/components/documents/document-upload-dialog.tsx src/app/api/documents/[id]/process/route.ts
git commit -m "fix: correct storage bucket name from documents to prescriptions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Fix RLS Policy for Drug Interactions

**Priority:** 🔴 CRITICAL - Authorization bypass possible

**Files:**
- Create: `supabase/migrations/002_fix_interaction_rls.sql`

**Step 1: Create migration file**

```sql
-- Fix incomplete RLS policy for drug_interactions
-- Previous policy only checked medicine_1_id ownership

DROP POLICY IF EXISTS "Users can view interactions for their medicines" ON drug_interactions;

CREATE POLICY "Users can view interactions for their medicines"
    ON drug_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medicines m1
            JOIN family_members fm1 ON fm1.id = m1.owner_id
            WHERE m1.id = drug_interactions.medicine_1_id
            AND fm1.created_by = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM medicines m2
            JOIN family_members fm2 ON fm2.id = m2.owner_id
            WHERE m2.id = drug_interactions.medicine_2_id
            AND fm2.created_by = auth.uid()
        )
    );
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard

**Step 3: Test**

1. Create two users with different medicines
2. User A should NOT see interactions involving User B's medicines
3. Verify query returns empty for cross-user access attempts

**Step 4: Commit**

```bash
git add supabase/migrations/002_fix_interaction_rls.sql
git commit -m "fix: complete RLS policy to check both medicine owners

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Fix SQL Injection Risk in Interactions

**Priority:** 🔴 CRITICAL - Potential SQL injection

**Files:**
- Modify: `src/actions/interactions.ts` (lines 55, 131, 195)

**Step 1: Add UUID validation utility**

Add to `src/lib/utils.ts`:

```typescript
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function validateUUIDs(ids: string[]): string[] {
  return ids.filter(isValidUUID);
}
```

**Step 2: Update interactions.ts**

```typescript
import { validateUUIDs } from "@/lib/utils";

// Line 55 - In getInteractionsForMedicines
const validIds = validateUUIDs(medicineIds);
if (validIds.length === 0) return [];

const { data, error } = await supabase
  .from("drug_interactions")
  .select("*")
  .or(`medicine_1_id.in.(${validIds.join(",")}),medicine_2_id.in.(${validIds.join(",")})`)

// Apply same pattern to lines 131 and 195
```

**Step 3: Test**

1. Pass valid UUIDs - should return results
2. Pass malformed strings - should be filtered out
3. Pass empty array - should return empty result

**Step 4: Commit**

```bash
git add src/lib/utils.ts src/actions/interactions.ts
git commit -m "fix: validate UUIDs before SQL interpolation to prevent injection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Fix Race Condition in Document Processing

**Priority:** 🟠 HIGH - Duplicate processing possible

**Files:**
- Modify: `src/app/api/documents/[id]/process/route.ts` (lines 69-77)

**Step 1: Update to atomic status check**

```typescript
// Replace lines 69-77 with atomic update
const { data: updated, error: updateError } = await supabase
  .from("documents")
  .update({ ocr_status: "processing" })
  .eq("id", documentId)
  .eq("ocr_status", "pending")  // Only update if still pending
  .select()
  .single();

if (!updated) {
  return NextResponse.json(
    { error: "Document already processing or completed" },
    { status: 409 }
  );
}

// Remove the separate status check that was here
```

**Step 2: Test**

1. Click process button rapidly multiple times
2. Should only process once
3. Subsequent clicks should return 409 error

**Step 3: Commit**

```bash
git add src/app/api/documents/[id]/process/route.ts
git commit -m "fix: use atomic update to prevent duplicate document processing

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Add Environment Variable Validation

**Priority:** 🟠 HIGH - Auth flows break silently

**Files:**
- Create: `src/lib/env.ts`
- Modify: `src/actions/auth.ts` (lines 42, 98)

**Step 1: Create env validation**

```typescript
// src/lib/env.ts
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  SITE_URL: getRequiredEnv("NEXT_PUBLIC_SITE_URL"),
  SUPABASE_URL: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
} as const;
```

**Step 2: Update auth.ts**

```typescript
import { env } from "@/lib/env";

// Line 42
options: {
  emailRedirectTo: `${env.SITE_URL}/auth/callback`,
},

// Line 98
redirectTo: `${env.SITE_URL}/auth/callback`,
```

**Step 3: Test**

1. Remove NEXT_PUBLIC_SITE_URL from .env.local
2. App should throw clear error on startup
3. Restore variable, auth should work

**Step 4: Commit**

```bash
git add src/lib/env.ts src/actions/auth.ts
git commit -m "fix: validate required environment variables on startup

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Bug Fixes & UX Improvements

### Task 6: Fix Stale UI After Delete Operations

**Priority:** 🟠 HIGH - UX feels buggy

**Files:**
- Modify: `src/components/family/family-member-card.tsx`
- Modify: `src/components/medicines/medicine-card.tsx`
- Modify: `src/components/documents/document-card.tsx`

**Step 1: Update family-member-card.tsx**

Replace window.reload() with router.refresh():

```typescript
import { useRouter } from "next/navigation";

export function FamilyMemberCard({ member }: FamilyMemberCardProps) {
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFamilyMember(member.id);
      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();  // Replace window.location.reload()
      }
    });
  };
```

**Step 2: Apply same pattern to medicine-card.tsx and document-card.tsx**

**Step 3: Test**

1. Delete a family member - should disappear smoothly
2. Delete a medicine - should disappear smoothly
3. Delete a document - should disappear smoothly
4. No full page reload flash

**Step 4: Commit**

```bash
git add src/components/family/family-member-card.tsx src/components/medicines/medicine-card.tsx src/components/documents/document-card.tsx
git commit -m "fix: use router.refresh() instead of window.reload() for smoother UX

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Remove Dead Glucose Tracking Link

**Priority:** 🟡 MEDIUM - Confuses users

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (lines 204-216)

**Step 1: Comment out or remove the glucose link**

```typescript
// Remove or comment out this section until Phase 6 is implemented:
{/*
<Link href="/dashboard/glucose" className="...">
  <Pill className="h-5 w-5" />
  <span>Log Glucose</span>
</Link>
*/}
```

**Step 2: Test**

1. Dashboard should not show glucose tracking link
2. No dead links in navigation

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "fix: remove glucose tracking link until Phase 6 implementation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Add Error Boundaries

**Priority:** 🟡 MEDIUM - Prevents white screen of death

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/(dashboard)/error.tsx`

**Step 1: Create root error boundary**

```typescript
// src/app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 text-center">
        We encountered an unexpected error. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
```

**Step 2: Create dashboard error boundary**

```typescript
// src/app/(dashboard)/error.tsx
"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard Error</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Something went wrong loading this page. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 min-h-[44px]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 border rounded-md hover:bg-muted min-h-[44px] flex items-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
```

**Step 3: Test**

1. Temporarily throw error in a component
2. Error boundary should catch and display recovery UI
3. "Try again" should reset the error state

**Step 4: Commit**

```bash
git add src/app/error.tsx src/app/(dashboard)/error.tsx
git commit -m "feat: add error boundaries for graceful error recovery

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Code Quality & DRY Improvements

### Task 9: Extract Authentication Helper

**Priority:** 🟡 MEDIUM - Eliminates 20+ duplications

**Files:**
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/actions/documents.ts`
- Modify: `src/actions/medicines.ts`
- Modify: `src/actions/family.ts`
- Modify: `src/actions/interactions.ts`
- Modify: `src/actions/relationships.ts`

**Step 1: Add helper to server.ts**

```typescript
// Add to src/lib/supabase/server.ts
import { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Not authenticated" };
  }

  return { supabase, user, error: null };
}
```

**Step 2: Update all server actions**

Replace this pattern everywhere:
```typescript
// OLD (repeated 20+ times)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { error: "Not authenticated" };
}

// NEW
const { supabase, user, error } = await getAuthenticatedUser();
if (error) return { error };
```

**Step 3: Test**

1. All authenticated actions should still work
2. Unauthenticated requests should return error

**Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/actions/*.ts
git commit -m "refactor: extract getAuthenticatedUser helper to reduce duplication

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Extract Delete Confirmation Dialog

**Priority:** 🟢 LOW - Reduces code duplication

**Files:**
- Create: `src/components/ui/delete-confirmation-dialog.tsx`
- Modify: `src/components/family/family-member-card.tsx`
- Modify: `src/components/medicines/medicine-card.tsx`
- Modify: `src/components/documents/document-card.tsx`

**Step 1: Create reusable component**

```typescript
// src/components/ui/delete-confirmation-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 min-h-[44px]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Step 2: Update card components to use new dialog**

```typescript
// In each card component
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

<DeleteConfirmationDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title={`Delete ${entityType}?`}
  description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
  onConfirm={handleDelete}
  isDeleting={isPending}
/>
```

**Step 3: Test**

1. Delete dialogs should work the same as before
2. All three card types should use the shared component

**Step 4: Commit**

```bash
git add src/components/ui/delete-confirmation-dialog.tsx src/components/family/family-member-card.tsx src/components/medicines/medicine-card.tsx src/components/documents/document-card.tsx
git commit -m "refactor: extract reusable DeleteConfirmationDialog component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Extract formatDate Utility

**Priority:** 🟢 LOW - Small DRY improvement

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/components/family/family-member-card.tsx`
- Modify: `src/components/documents/document-card.tsx`

**Step 1: Add to utils.ts**

```typescript
export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
```

**Step 2: Update components to import from utils**

```typescript
import { formatDate } from "@/lib/utils";

// Remove local formatDate function definitions
```

**Step 3: Test**

1. Dates should display the same as before
2. Format: "29 Jan 2026"

**Step 4: Commit**

```bash
git add src/lib/utils.ts src/components/family/family-member-card.tsx src/components/documents/document-card.tsx
git commit -m "refactor: extract formatDate utility to reduce duplication

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Optimize Dashboard Queries

**Priority:** 🟡 MEDIUM - Performance improvement

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (lines 7-66)

**Step 1: Consolidate queries using Promise.all**

```typescript
async function getStats(userId: string) {
  const supabase = await createClient();

  // Get family members first (needed for filtering)
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", userId);

  const memberIds = members?.map(m => m.id) ?? [];

  if (memberIds.length === 0) {
    return { familyCount: 0, documentCount: 0, medicineCount: 0, interactionCount: 0 };
  }

  // Run remaining counts in parallel
  const [familyResult, docsResult, medsResult, medsForInteractions] = await Promise.all([
    supabase.from("family_members").select("*", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("documents").select("*", { count: "exact", head: true }).in("owner_id", memberIds),
    supabase.from("medicines").select("*", { count: "exact", head: true }).in("owner_id", memberIds).eq("is_active", true),
    supabase.from("medicines").select("id").in("owner_id", memberIds).eq("is_active", true),
  ]);

  const medicineIds = medsForInteractions.data?.map(m => m.id) ?? [];

  let interactionCount = 0;
  if (medicineIds.length > 0) {
    const { count } = await supabase
      .from("drug_interactions")
      .select("*", { count: "exact", head: true })
      .or(`medicine_1_id.in.(${medicineIds.join(",")}),medicine_2_id.in.(${medicineIds.join(",")})`)
      .eq("is_acknowledged", false);
    interactionCount = count ?? 0;
  }

  return {
    familyCount: familyResult.count ?? 0,
    documentCount: docsResult.count ?? 0,
    medicineCount: medsResult.count ?? 0,
    interactionCount,
  };
}
```

**Step 2: Test**

1. Dashboard should load with all stats
2. Stats should be accurate
3. Page load should feel faster

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "perf: parallelize dashboard queries with Promise.all

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Accessibility Improvements

### Task 13: Add Accessibility Attributes

**Priority:** 🟡 MEDIUM - Improves a11y

**Files:**
- Modify: `src/components/layout/mobile-nav.tsx`
- Modify: `src/components/family/family-tree.tsx`
- Modify: `src/components/family/family-member-card.tsx`

**Step 1: Add aria-current to mobile nav**

```typescript
// mobile-nav.tsx
import { usePathname } from "next/navigation";

const pathname = usePathname();
const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

<Link
  href="/dashboard/family"
  aria-current={isActive("/dashboard/family") ? "page" : undefined}
  className={cn("...", isActive("/dashboard/family") && "text-primary font-medium")}
>
```

**Step 2: Add aria-label to SVG tree nodes**

```typescript
// family-tree.tsx
<g
  key={node.id}
  aria-label={`${node.displayName}, ${node.gender === 'female' ? 'Female' : 'Male'} family member`}
  role="button"
  tabIndex={0}
>
```

**Step 3: Add aria-label to icon-only buttons**

```typescript
// family-member-card.tsx
<Button
  variant="ghost"
  size="icon"
  aria-label={`More options for ${member.full_name}`}
>
  <MoreVertical className="h-4 w-4" />
</Button>
```

**Step 4: Test**

1. Tab through mobile nav - active state should be announced
2. Screen reader should announce tree node names
3. Icon buttons should have accessible names

**Step 5: Commit**

```bash
git add src/components/layout/mobile-nav.tsx src/components/family/family-tree.tsx src/components/family/family-member-card.tsx
git commit -m "a11y: add aria attributes for better screen reader support

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Phase | Tasks | Priority | Estimated Effort |
|-------|-------|----------|------------------|
| 1: Security | Tasks 1-5 | 🔴 Critical | 4-6 hours |
| 2: Bug Fixes | Tasks 6-8 | 🟠 High | 2-3 hours |
| 3: Code Quality | Tasks 9-12 | 🟡 Medium | 3-4 hours |
| 4: Accessibility | Task 13 | 🟡 Medium | 1-2 hours |

**Total Estimated Effort:** 10-15 hours

**Recommended Order:** Execute phases 1-4 sequentially. Phase 1 is blocking for production deployment.
