-- Migration: add manager_comment to fichajes table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.fichajes
  ADD COLUMN IF NOT EXISTS manager_comment text;
