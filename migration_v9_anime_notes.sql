ALTER TABLE public.granular_notes DROP CONSTRAINT IF EXISTS chk_granular_notes_media;

ALTER TABLE public.granular_notes
ADD COLUMN user_anime_id UUID REFERENCES public.user_animes(id) ON DELETE CASCADE;

ALTER TABLE public.granular_notes
ADD CONSTRAINT chk_granular_notes_media 
CHECK (
  (user_book_id IS NOT NULL AND user_movie_id IS NULL AND user_anime_id IS NULL) OR
  (user_book_id IS NULL AND user_movie_id IS NOT NULL AND user_anime_id IS NULL) OR
  (user_book_id IS NULL AND user_movie_id IS NULL AND user_anime_id IS NOT NULL)
);
