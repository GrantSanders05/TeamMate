-- ============================================================
-- TEAMMATE — Complete Supabase SQL Schema
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- ----------------------
-- TABLES
-- ----------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  secondary_color TEXT DEFAULT '#1E40AF',
  font_family TEXT DEFAULT 'Inter',
  timezone TEXT DEFAULT 'America/New_York',
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('manager', 'employee')) DEFAULT 'employee',
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scheduling_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('weekly', 'monthly')),
  status TEXT CHECK (status IN ('draft', 'collecting', 'scheduling', 'published', 'archived')) DEFAULT 'draft',
  availability_link_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduling_period_id UUID REFERENCES scheduling_periods(id) ON DELETE CASCADE,
  shift_type_id UUID REFERENCES shift_types(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT NOT NULL,
  required_workers INTEGER DEFAULT 1,
  notes TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('available', 'unavailable', 'all_day')) DEFAULT 'available',
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_id, employee_id)
);

CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id),
  manual_name TEXT,
  assigned_by UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('assigned', 'dropped', 'open')) DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  CHECK (employee_id IS NOT NULL OR manual_name IS NOT NULL)
);

CREATE TABLE drop_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES shift_assignments(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE schedule_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduling_period_id UUID REFERENCES scheduling_periods(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now(),
  archived_by UUID REFERENCES profiles(id)
);

-- ----------------------
-- INDEXES
-- ----------------------

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_shifts_period ON shifts(scheduling_period_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_availability_shift ON availability_responses(shift_id);
CREATE INDEX idx_availability_employee ON availability_responses(employee_id);
CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX idx_periods_org ON scheduling_periods(organization_id);
CREATE INDEX idx_periods_status ON scheduling_periods(status);
CREATE INDEX idx_drop_requests_status ON drop_requests(status);

-- ----------------------
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ----------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------
-- ROW LEVEL SECURITY
-- ----------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_archives ENABLE ROW LEVEL SECURITY;

-- Helper function: is user a member of an org?
CREATE OR REPLACE FUNCTION is_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: is user a manager of an org?
CREATE OR REPLACE FUNCTION is_manager(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'manager'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Members can see org member profiles" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id AND om1.is_active = true
    )
  );

-- ORGANIZATIONS
CREATE POLICY "Members can read org" ON organizations FOR SELECT USING (is_member(id));
CREATE POLICY "Managers can update org" ON organizations FOR UPDATE USING (is_manager(id));
CREATE POLICY "Authenticated users can create org" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can delete org" ON organizations FOR DELETE USING (is_manager(id));

-- ORGANIZATION MEMBERS
CREATE POLICY "Members can read org members" ON organization_members FOR SELECT USING (is_member(organization_id));
CREATE POLICY "Managers can insert members" ON organization_members FOR INSERT WITH CHECK (is_manager(organization_id) OR user_id = auth.uid());
CREATE POLICY "Managers can update members" ON organization_members FOR UPDATE USING (is_manager(organization_id));
CREATE POLICY "Allow self-insert when joining" ON organization_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- SHIFT TYPES
CREATE POLICY "Members can read shift types" ON shift_types FOR SELECT USING (is_member(organization_id));
CREATE POLICY "Managers can insert shift types" ON shift_types FOR INSERT WITH CHECK (is_manager(organization_id));
CREATE POLICY "Managers can update shift types" ON shift_types FOR UPDATE USING (is_manager(organization_id));
CREATE POLICY "Managers can delete shift types" ON shift_types FOR DELETE USING (is_manager(organization_id));

-- SCHEDULING PERIODS
CREATE POLICY "Managers full access to periods" ON scheduling_periods FOR ALL USING (is_manager(organization_id));
CREATE POLICY "Employees can read visible periods" ON scheduling_periods FOR SELECT
  USING (
    is_member(organization_id) AND status IN ('collecting', 'published', 'archived')
  );

-- SHIFTS
CREATE POLICY "Managers full access to shifts" ON shifts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM scheduling_periods sp WHERE sp.id = scheduling_period_id AND is_manager(sp.organization_id))
  );
CREATE POLICY "Employees can read shifts for accessible periods" ON shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduling_periods sp
      WHERE sp.id = scheduling_period_id
      AND is_member(sp.organization_id)
      AND sp.status IN ('collecting', 'published', 'archived')
    )
  );

-- AVAILABILITY RESPONSES
CREATE POLICY "Employees can manage own availability" ON availability_responses FOR ALL
  USING (employee_id = auth.uid())
  WITH CHECK (
    employee_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM shifts s
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE s.id = shift_id AND sp.status = 'collecting'
    )
  );
CREATE POLICY "Managers can read all availability for their org" ON availability_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shifts s
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE s.id = shift_id AND is_manager(sp.organization_id)
    )
  );

-- SHIFT ASSIGNMENTS
CREATE POLICY "Managers full access to assignments" ON shift_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shifts s
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE s.id = shift_id AND is_manager(sp.organization_id)
    )
  );
CREATE POLICY "Employees can read assignments for published periods" ON shift_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shifts s
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE s.id = shift_id
      AND is_member(sp.organization_id)
      AND sp.status IN ('published', 'archived')
    )
  );

-- DROP REQUESTS
CREATE POLICY "Employees can create own drop requests" ON drop_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Employees can read own drop requests" ON drop_requests FOR SELECT
  USING (requested_by = auth.uid());
CREATE POLICY "Managers can read all drop requests" ON drop_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      JOIN shifts s ON s.id = sa.shift_id
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE sa.id = assignment_id AND is_manager(sp.organization_id)
    )
  );
CREATE POLICY "Managers can update drop requests" ON drop_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shift_assignments sa
      JOIN shifts s ON s.id = sa.shift_id
      JOIN scheduling_periods sp ON sp.id = s.scheduling_period_id
      WHERE sa.id = assignment_id AND is_manager(sp.organization_id)
    )
  );

-- SCHEDULE ARCHIVES
CREATE POLICY "Managers full access to archives" ON schedule_archives FOR ALL USING (is_manager(organization_id));
CREATE POLICY "Employees can read archives" ON schedule_archives FOR SELECT USING (is_member(organization_id));

-- ----------------------
-- STORAGE
-- ----------------------

-- Run these in the Storage section of your Supabase dashboard,
-- or uncomment and run here if you have the storage extension:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- CREATE POLICY "Authenticated users can upload logos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Public read access for logos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'org-logos');
