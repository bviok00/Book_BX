-- 폴더 테이블에 미디어 타입 구분을 위한 컬럼 추가
ALTER TABLE public.folders 
ADD COLUMN media_type VARCHAR(10) NOT NULL DEFAULT 'BOOK';

-- 타입 제약조건 추가 (선택사항)
ALTER TABLE public.folders 
ADD CONSTRAINT chk_folders_media_type CHECK (media_type IN ('BOOK', 'MOVIE'));

-- 참고: 기존에 생성된 폴더들은 모두 기본값인 'BOOK'으로 설정됩니다.
