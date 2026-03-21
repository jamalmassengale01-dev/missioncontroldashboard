-- Supabase Schema for Mission Control
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflow definitions table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_agent TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  input_schema JSONB DEFAULT '{}'::jsonb,
  output_schema JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  assigned_agent TEXT,
  input JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  output JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  parent_run_id TEXT,
  child_run_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id TEXT REFERENCES workflow_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Metrics table for time-series data
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- System events table
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_agent ON workflow_runs(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_run_id ON workflow_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_timestamp ON workflow_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_name_timestamp ON metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for service role)
CREATE POLICY "Allow all" ON workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON workflow_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON workflow_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON system_events FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for workflows updated_at
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Realtime publication (optional - enable if using Supabase Realtime)
-- BEGIN;
--   DROP PUBLICATION IF EXISTS supabase_realtime;
--   CREATE PUBLICATION supabase_realtime;
-- COMMIT;
-- ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE workflow_logs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE system_events;
