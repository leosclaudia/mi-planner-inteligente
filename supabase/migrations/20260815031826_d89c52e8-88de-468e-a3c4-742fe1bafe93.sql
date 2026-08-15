CREATE TABLE public.planner_sync (
  user_id uuid NOT NULL PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_sync TO authenticated;
GRANT ALL ON public.planner_sync TO service_role;

ALTER TABLE public.planner_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own planner data"
  ON public.planner_sync FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_planner_sync_updated_at
BEFORE UPDATE ON public.planner_sync
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();