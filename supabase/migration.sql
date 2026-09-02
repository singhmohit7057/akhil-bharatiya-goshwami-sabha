-- Akhil Bharatiya Goshwami Sabha - Database Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CUSTOM TYPES
-- ===========================================

CREATE TYPE account_status AS ENUM (
  'pending_approval', 'approved', 'active', 'rejected', 'suspended'
);

CREATE TYPE member_role AS ENUM (
  'member', 'president', 'vice_president', 'secretary', 'joint_secretary',
  'treasurer', 'joint_treasurer', 'coordinator', 'mentor', 'deputy_chairman',
  'chairman', 'vice_chairman', 'working_president', 'joint_working_president',
  'public_relation_officer', 'legal_advisor', 'media_spoke_person', 'executive_member'
);

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TYPE admin_level AS ENUM ('none', 'admin', 'super_admin');

CREATE TYPE family_relation AS ENUM (
  'father', 'mother', 'spouse', 'son', 'daughter',
  'brother', 'sister', 'grandfather', 'grandmother', 'other'
);

-- ===========================================
-- PROFILES
-- ===========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  full_name_hi TEXT,
  role member_role NOT NULL DEFAULT 'member',
  admin_level admin_level NOT NULL DEFAULT 'none',
  account_status account_status NOT NULL DEFAULT 'pending_approval',
  is_executive_member BOOLEAN DEFAULT false,
  gender gender_type,
  date_of_birth DATE,
  gotra TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  profile_photo_url TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- FAMILY MEMBERS
-- ===========================================

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_hi TEXT,
  relation family_relation NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- BUSINESS DETAILS (user's own job/business)
-- ===========================================

CREATE TABLE business_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  sector TEXT,
  designation TEXT,
  location TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  is_employed BOOLEAN DEFAULT true,
  employer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- BUSINESS DIRECTORY (public listings)
-- ===========================================

CREATE TABLE business_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description_en TEXT,
  description_hi TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- EVENTS
-- ===========================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DONATIONS
-- ===========================================

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose TEXT,
  receipt_url TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MATRIMONIAL PROFILES
-- ===========================================

CREATE TABLE matrimonial_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  height TEXT,
  education TEXT,
  occupation TEXT,
  income_range TEXT,
  about_en TEXT,
  about_hi TEXT,
  preferences_en TEXT,
  preferences_hi TEXT,
  marital_status TEXT DEFAULT 'unmarried' CHECK (marital_status IN ('unmarried', 'divorced', 'widowed')),
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matrimonial_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matrimonial_id UUID NOT NULL REFERENCES matrimonial_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_profiles_status ON profiles(account_status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_executive ON profiles(is_executive_member);
CREATE INDEX idx_family_user ON family_members(user_id);
CREATE INDEX idx_business_details_user ON business_details(user_id);
CREATE INDEX idx_directory_category ON business_directory(category);
CREATE INDEX idx_directory_approved ON business_directory(is_approved, is_active);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_published ON events(is_published);
CREATE INDEX idx_donations_user ON donations(user_id);
CREATE INDEX idx_matrimonial_user ON matrimonial_profiles(user_id);
CREATE INDEX idx_matrimonial_active ON matrimonial_profiles(is_active, is_approved);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrimonial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrimonial_photos ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view active profiles"
  ON profiles FOR SELECT TO authenticated
  USING (account_status IN ('approved', 'active'));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman', 'coordinator', 'vice_president', 'joint_secretary', 'treasurer', 'joint_treasurer', 'vice_chairman')
    )
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman', 'coordinator', 'vice_president', 'joint_secretary', 'treasurer', 'joint_treasurer', 'vice_chairman')
    )
  );

CREATE POLICY "New users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Family Members
CREATE POLICY "Users can manage own family members"
  ON family_members FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Business Details
CREATE POLICY "Users can manage own business details"
  ON business_details FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Business Directory
CREATE POLICY "Anyone can view approved listings"
  ON business_directory FOR SELECT
  USING (is_approved = true AND is_active = true);

CREATE POLICY "Users can manage own listings"
  ON business_directory FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all listings"
  ON business_directory FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman')
    )
  );

-- Events
CREATE POLICY "Published events are public"
  ON events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman', 'coordinator')
    )
  );

-- Donations
CREATE POLICY "Users can view own donations"
  ON donations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage donations"
  ON donations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman', 'treasurer', 'joint_treasurer')
    )
  );

-- Matrimonial
CREATE POLICY "Executive members can view approved matrimonial"
  ON matrimonial_profiles FOR SELECT TO authenticated
  USING (
    is_active = true AND is_approved = true
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_executive_member = true
    )
  );

CREATE POLICY "Users can manage own matrimonial"
  ON matrimonial_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all matrimonial"
  ON matrimonial_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('president', 'secretary', 'chairman')
    )
  );

-- Matrimonial Photos
CREATE POLICY "Executive members can view matrimonial photos"
  ON matrimonial_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_executive_member = true
    )
  );

CREATE POLICY "Users can manage own matrimonial photos"
  ON matrimonial_photos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matrimonial_profiles mp
      WHERE mp.id = matrimonial_id AND mp.user_id = auth.uid()
    )
  );

-- ===========================================
-- TRIGGERS
-- ===========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending_approval'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER family_members_updated_at BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER business_details_updated_at BEFORE UPDATE ON business_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER business_directory_updated_at BEFORE UPDATE ON business_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matrimonial_updated_at BEFORE UPDATE ON matrimonial_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
