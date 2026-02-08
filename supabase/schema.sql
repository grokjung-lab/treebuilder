-- Hierarchy Builder Pro - Supabase 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- https://supabase.com/dashboard/project/ezfinefvnvbzoydxuvxj/sql/new

CREATE TABLE IF NOT EXISTS hierarchy_projects (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  root_node_id TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_projects_username ON hierarchy_projects(username);

-- RLS (Row Level Security) - 익명 사용자 허용 (anon key)
-- 보안 강화 시 Supabase Auth 연동 후 user_id 기반 정책으로 변경 가능
ALTER TABLE hierarchy_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON hierarchy_projects;
CREATE POLICY "Allow all for anon" ON hierarchy_projects
  FOR ALL
  USING (true)
  WITH CHECK (true);
