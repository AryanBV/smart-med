-- ============================================
-- SMART-MED DATABASE SCHEMA
-- Version: 1.0
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM ('parent', 'child', 'spouse', 'sibling');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_level AS ENUM ('view', 'edit', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reading_type AS ENUM ('fasting', 'pre_meal', 'post_meal', 'random', 'bedtime');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_context AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_severity AS ENUM ('minor', 'moderate', 'major', 'contraindicated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- HELPER FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLE 1: PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender gender,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLE 2: FAMILY MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender gender,
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view family members they created" ON family_members;
CREATE POLICY "Users can view family members they created"
    ON family_members FOR SELECT
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert family members" ON family_members;
CREATE POLICY "Users can insert family members"
    ON family_members FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update family members they created" ON family_members;
CREATE POLICY "Users can update family members they created"
    ON family_members FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete family members they created" ON family_members;
CREATE POLICY "Users can delete family members they created"
    ON family_members FOR DELETE
    USING (auth.uid() = created_by);

-- ============================================
-- TABLE 3: FAMILY RELATIONSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS family_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    related_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT no_self_relationship CHECK (member_id != related_member_id),
    CONSTRAINT unique_relationship UNIQUE (member_id, related_member_id, relationship_type)
);

-- RLS for family_relationships
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relationships of their family members" ON family_relationships;
CREATE POLICY "Users can view relationships of their family members"
    ON family_relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = family_relationships.member_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert relationships for their family members" ON family_relationships;
CREATE POLICY "Users can insert relationships for their family members"
    ON family_relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = member_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete relationships of their family members" ON family_relationships;
CREATE POLICY "Users can delete relationships of their family members"
    ON family_relationships FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = family_relationships.member_id
            AND family_members.created_by = auth.uid()
        )
    );

-- ============================================
-- TABLE 4: ACCESS PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    permission_level permission_level DEFAULT 'view' NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    CONSTRAINT no_self_permission CHECK (owner_id != viewer_id),
    CONSTRAINT unique_permission UNIQUE (owner_id, viewer_id)
);

-- RLS for access_permissions
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view permissions they granted" ON access_permissions;
CREATE POLICY "Users can view permissions they granted"
    ON access_permissions FOR SELECT
    USING (auth.uid() = granted_by);

DROP POLICY IF EXISTS "Users can insert permissions" ON access_permissions;
CREATE POLICY "Users can insert permissions"
    ON access_permissions FOR INSERT
    WITH CHECK (auth.uid() = granted_by);

DROP POLICY IF EXISTS "Users can update permissions they granted" ON access_permissions;
CREATE POLICY "Users can update permissions they granted"
    ON access_permissions FOR UPDATE
    USING (auth.uid() = granted_by);

DROP POLICY IF EXISTS "Users can delete permissions they granted" ON access_permissions;
CREATE POLICY "Users can delete permissions they granted"
    ON access_permissions FOR DELETE
    USING (auth.uid() = granted_by);

-- ============================================
-- TABLE 5: DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    ocr_status document_status DEFAULT 'pending' NOT NULL,
    ocr_text TEXT,
    ocr_error TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ
);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view documents of family members they created" ON documents;
CREATE POLICY "Users can view documents of family members they created"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = documents.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert documents for family members they created" ON documents;
CREATE POLICY "Users can insert documents for family members they created"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update documents of family members they created" ON documents;
CREATE POLICY "Users can update documents of family members they created"
    ON documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = documents.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete documents of family members they created" ON documents;
CREATE POLICY "Users can delete documents of family members they created"
    ON documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = documents.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

-- ============================================
-- TABLE 6: MEDICINES
-- ============================================
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    fda_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS update_medicines_updated_at ON medicines;
CREATE TRIGGER update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for medicines
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view medicines of family members they created" ON medicines;
CREATE POLICY "Users can view medicines of family members they created"
    ON medicines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = medicines.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert medicines for family members they created" ON medicines;
CREATE POLICY "Users can insert medicines for family members they created"
    ON medicines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update medicines of family members they created" ON medicines;
CREATE POLICY "Users can update medicines of family members they created"
    ON medicines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = medicines.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete medicines of family members they created" ON medicines;
CREATE POLICY "Users can delete medicines of family members they created"
    ON medicines FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = medicines.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

-- ============================================
-- TABLE 7: DRUG INTERACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS drug_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_1_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_2_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    severity interaction_severity NOT NULL,
    description TEXT NOT NULL,
    source TEXT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_interaction UNIQUE (medicine_1_id, medicine_2_id)
);

-- RLS for drug_interactions
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view interactions for their medicines" ON drug_interactions;
CREATE POLICY "Users can view interactions for their medicines"
    ON drug_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medicines
            JOIN family_members ON family_members.id = medicines.owner_id
            WHERE medicines.id = drug_interactions.medicine_1_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert interactions for their medicines" ON drug_interactions;
CREATE POLICY "Users can insert interactions for their medicines"
    ON drug_interactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM medicines
            JOIN family_members ON family_members.id = medicines.owner_id
            WHERE medicines.id = medicine_1_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update interactions for their medicines" ON drug_interactions;
CREATE POLICY "Users can update interactions for their medicines"
    ON drug_interactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM medicines
            JOIN family_members ON family_members.id = medicines.owner_id
            WHERE medicines.id = drug_interactions.medicine_1_id
            AND family_members.created_by = auth.uid()
        )
    );

-- ============================================
-- TABLE 8: GLUCOSE READINGS
-- ============================================
CREATE TABLE IF NOT EXISTS glucose_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    value DECIMAL(5,1) NOT NULL,
    unit TEXT DEFAULT 'mg/dL' NOT NULL,
    reading_type reading_type NOT NULL,
    meal_context meal_context,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for glucose_readings
ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view glucose readings of family members they created" ON glucose_readings;
CREATE POLICY "Users can view glucose readings of family members they created"
    ON glucose_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = glucose_readings.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert glucose readings for family members they created" ON glucose_readings;
CREATE POLICY "Users can insert glucose readings for family members they created"
    ON glucose_readings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update glucose readings of family members they created" ON glucose_readings;
CREATE POLICY "Users can update glucose readings of family members they created"
    ON glucose_readings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = glucose_readings.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete glucose readings of family members they created" ON glucose_readings;
CREATE POLICY "Users can delete glucose readings of family members they created"
    ON glucose_readings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.id = glucose_readings.owner_id
            AND family_members.created_by = auth.uid()
        )
    );

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE: Prescriptions bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (files stored as {user_id}/{filename})
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- DONE! Verify tables in Supabase Dashboard
-- ============================================
