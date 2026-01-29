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
