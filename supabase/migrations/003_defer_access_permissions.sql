-- Migration: 003_defer_access_permissions.sql
-- The access_permissions table exists but is not yet used in the application layer.
-- It will be implemented in a future phase for hierarchical access control.
-- This migration adds a comment to document the deferred status.

COMMENT ON TABLE access_permissions IS
  'DEFERRED: Hierarchical access control - not yet implemented in application layer. Planned for Phase 7. Schema is ready with RLS policies.';
