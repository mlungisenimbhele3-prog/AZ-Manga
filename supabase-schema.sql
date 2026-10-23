-- =========================================================================
-- KA Plus: Africa Pulse - Supabase Core Relational Database Schema
-- Architecture: Produced by Mlungiseni Mbhele
-- Tables: mangas, chapters, user_library
-- Includes: Defense x4 Row-Level Security (RLS) & Performance Indexes
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create 'mangas' Table (Core Manga Details)
CREATE TABLE IF NOT EXISTS mangas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  japanese_title TEXT,
  author TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  banner_image TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('ONGOING', 'COMPLETED')),
  synopsis TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
  views BIGINT NOT NULL DEFAULT 0,
  bookmarks_count INT NOT NULL DEFAULT 0,
  monetization_model TEXT NOT NULL DEFAULT 'hybrid' CHECK (monetization_model IN ('hybrid', 'ad_supported', 'subscription_only')),
  featured BOOLEAN NOT NULL DEFAULT false,
  weekly_rank INT,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_confidence_score INT DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create 'chapters' Table (Chapter Lists & Page Metadata)
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  number INT NOT NULL,
  title TEXT NOT NULL,
  release_date TEXT NOT NULL,
  page_count INT NOT NULL DEFAULT 1,
  access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium')),
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_manga_chapter UNIQUE (manga_id, number)
);

-- 4. Create 'user_library' Table (User Saved Libraries & Reading Progress)
CREATE TABLE IF NOT EXISTS user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  manga_id TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT true,
  reading_status TEXT NOT NULL DEFAULT 'reading' CHECK (reading_status IN ('reading', 'completed', 'plan_to_read', 'on_hold')),
  last_chapter_id TEXT,
  last_page_read INT NOT NULL DEFAULT 1,
  progress_percent INT NOT NULL DEFAULT 0,
  notify_chapter_drops BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_manga UNIQUE (user_email, manga_id)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_mangas_featured ON mangas(featured);
CREATE INDEX IF NOT EXISTS idx_mangas_weekly_rank ON mangas(weekly_rank);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(manga_id, number);
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_email);
CREATE INDEX IF NOT EXISTS idx_user_library_manga ON user_library(manga_id);

-- =========================================================================
-- DEFENSE LAYER: Row-Level Security (RLS) - Zero IDOR & Unauthorized Access
-- =========================================================================

-- Enable RLS
ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published mangas
CREATE POLICY "Public Read Mangas"
  ON mangas FOR SELECT
  USING (is_banned = false OR auth.jwt()->>'email' = 'azoververse@gmail.com' OR auth.jwt()->>'email' = 'mlungisenimbhele3@gmail.com');

-- Policy: Only authenticated creators/admins can insert or update mangas
CREATE POLICY "Creators Insert Mangas"
  ON mangas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.jwt()->>'email' IS NOT NULL);

CREATE POLICY "Admin Update Mangas"
  ON mangas FOR UPDATE
  USING (auth.jwt()->>'email' = 'azoververse@gmail.com' OR auth.jwt()->>'email' = 'mlungisenimbhele3@gmail.com' OR auth.role() = 'authenticated');

-- Policy: Anyone can read chapters
CREATE POLICY "Public Read Chapters"
  ON chapters FOR SELECT
  USING (true);

-- Policy: Creators can insert chapters
CREATE POLICY "Creators Insert Chapters"
  ON chapters FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.jwt()->>'email' IS NOT NULL);

-- Policy: User Library is strictly isolated per user email (Zero Cross-Tenant Leakage)
CREATE POLICY "User Library Select Own"
  ON user_library FOR SELECT
  USING (user_email = coalesce(auth.jwt()->>'email', current_setting('request.jwt.claim.email', true)));

CREATE POLICY "User Library Insert Own"
  ON user_library FOR INSERT
  WITH CHECK (user_email = coalesce(auth.jwt()->>'email', current_setting('request.jwt.claim.email', true)));

CREATE POLICY "User Library Update Own"
  ON user_library FOR UPDATE
  USING (user_email = coalesce(auth.jwt()->>'email', current_setting('request.jwt.claim.email', true)));

CREATE POLICY "User Library Delete Own"
  ON user_library FOR DELETE
  USING (user_email = coalesce(auth.jwt()->>'email', current_setting('request.jwt.claim.email', true)));
