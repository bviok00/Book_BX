-- movies 테이블에 대해 인증된 유저가 영화 정보를 업데이트(upsert) 할 수 있도록 RLS 정책을 추가합니다.

-- 기존 "인증 유저 영화 삽입" 정책은 그대로 둡니다.
-- upsert 기능을 위해 UPDATE 권한을 부여하는 정책을 추가합니다.
CREATE POLICY "인증 유저 영화 업데이트" ON public.movies
    FOR UPDATE USING (auth.role() = 'authenticated');
