ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS chk_folders_media_type;
ALTER TABLE public.folders ADD CONSTRAINT chk_folders_media_type CHECK (media_type IN ('BOOK', 'MOVIE', 'ANIME'));
