-- books 테이블에 대해 인증된 유저도 삽입 및 업데이트가 가능하도록 RLS 정책을 변경합니다.

-- 기존 "서버만 도서 삽입" 정책 삭제
DROP POLICY IF EXISTS "서버만 도서 삽입" ON public.books;

-- 인증된 유저 누구나 books 테이블에 도서 정보 삽입 가능
CREATE POLICY "인증 유저 도서 삽입" ON public.books
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- upsert 기능을 위해 UPDATE 권한도 필요할 수 있으므로 추가
CREATE POLICY "인증 유저 도서 업데이트" ON public.books
    FOR UPDATE USING (auth.role() = 'authenticated');
