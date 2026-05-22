import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const dummyBooks = [
  {
    isbn13: '9788966263158',
    title: '클린 아키텍처',
    author: '로버트 C. 마틴',
    publisher: '인사이트',
    pub_date: '2019-08-20',
    cover_url: 'https://image.aladin.co.kr/product/19368/10/cover500/8966263158_1.jpg',
    description: '소프트웨어 아키텍처의 보편적인 원칙',
    total_pages: 392,
  },
  {
    isbn13: '9788966263219',
    title: '클린 코드',
    author: '로버트 C. 마틴',
    publisher: '인사이트',
    pub_date: '2013-12-24',
    cover_url: 'https://image.aladin.co.kr/product/3408/36/cover500/8966260959_1.jpg',
    description: '애자일 소프트웨어 장인 정신',
    total_pages: 584,
  },
  {
    isbn13: '9791162243664',
    title: '프로그래머의 뇌',
    author: '펠리너 헤르만스',
    publisher: '제이펍',
    pub_date: '2022-01-12',
    cover_url: 'https://image.aladin.co.kr/product/28608/6/cover500/k572836262_1.jpg',
    description: '훌륭한 프로그래머가 되기 위해 알아야 할 인지과학',
    total_pages: 332,
  },
  {
    isbn13: '9788932917245',
    title: '사피엔스',
    author: '유발 하라리',
    publisher: '김영사',
    pub_date: '2015-11-23',
    cover_url: 'https://image.aladin.co.kr/product/7081/58/cover500/8932917248_1.jpg',
    description: '유인원에서 사이보그까지, 인간 역사의 대담하고 위대한 질문',
    total_pages: 636,
  },
  {
    isbn13: '9791187142560',
    title: '타이탄의 도구들',
    author: '팀 페리스',
    publisher: '토네이도',
    pub_date: '2017-04-03',
    cover_url: 'https://image.aladin.co.kr/product/10636/53/cover500/k002530182_1.jpg',
    description: '1만 시간의 법칙을 깬 거인들의 61가지 전략',
    total_pages: 360,
  },
  {
    isbn13: '9791190090018',
    title: '돈의 속성',
    author: '김승호',
    publisher: '스노우폭스북스',
    pub_date: '2020-06-15',
    cover_url: 'https://image.aladin.co.kr/product/24317/38/cover500/k142639088_1.jpg',
    description: '최상위 부자가 말하는 돈에 대한 모든 것',
    total_pages: 288,
  },
  {
    isbn13: '9788901260716',
    title: '역행자',
    author: '자청',
    publisher: '웅진지식하우스',
    pub_date: '2022-05-30',
    cover_url: 'https://image.aladin.co.kr/product/29524/1/cover500/8901260711_1.jpg',
    description: '돈 시간 운명으로부터 완전한 자유를 얻는 7단계 인생 공략집',
    total_pages: 312,
  },
  {
    isbn13: '9788950982255',
    title: '아주 작은 습관의 힘',
    author: '제임스 클리어',
    publisher: '비즈니스북스',
    pub_date: '2019-02-26',
    cover_url: 'https://image.aladin.co.kr/product/18151/52/cover500/8950982250_1.jpg',
    description: '최고의 변화는 어떻게 만들어지는가',
    total_pages: 360,
  },
  {
    isbn13: '9788931465945',
    title: '디자인의 디자인',
    author: '하라 켄야',
    publisher: '안그라픽스',
    pub_date: '2007-01-15',
    cover_url: 'https://image.aladin.co.kr/product/641/18/cover500/8970593175_1.jpg',
    description: '디자인의 본질에 대한 성찰',
    total_pages: 260,
  },
];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: '인증된 사용자만 더미 데이터를 생성할 수 있습니다.' }, { status: 401 });
  }

  try {
    // 1. 도서 데이터 (books) upsert
    for (const book of dummyBooks) {
      await supabase.from('books').upsert(book, { onConflict: 'isbn13' });
    }

    // 2. 유저 도서 추가 (user_books)
    const userBooksToInsert = dummyBooks.map((b, i) => {
      let status = 'completed';
      if (i % 3 === 0) status = 'reading';
      if (i % 4 === 0) status = 'want';

      return {
        user_id: user.id,
        isbn13: b.isbn13,
        status,
        my_rating: status === 'completed' ? Math.floor(Math.random() * 2) + 4 : null, // 4 or 5
      };
    });
    
    // Ignore duplicates if already exists
    for (const ub of userBooksToInsert) {
      await supabase.from('user_books').upsert(ub, { onConflict: 'user_id,isbn13' });
    }

    // 3. 폴더 생성 (folders)
    const folders = [
      { user_id: user.id, name: '2026년 목표' },
      { user_id: user.id, name: 'IT 기술서' },
      { user_id: user.id, name: '인문/교양' },
    ];
    
    // Check if folders exist first
    const { data: existingFolders } = await supabase.from('folders').select('id, name').eq('user_id', user.id);
    let techFolderId = existingFolders?.find(f => f.name === 'IT 기술서')?.id;
    
    if (!techFolderId) {
      const { data: insertedFolders } = await supabase.from('folders').insert(folders).select();
      techFolderId = insertedFolders?.find(f => f.name === 'IT 기술서')?.id;
    }

    // 4. 히트맵을 위한 과거 독서 세션 생성 (reading_sessions)
    // 과거 30일 동안 랜덤하게 세션 생성
    const sessions = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.4) { // 60% 확률로 독서함
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() - i);
        sessions.push({
          user_id: user.id,
          isbn13: dummyBooks[0].isbn13, // 클린 아키텍처
          date: sessionDate.toISOString().split('T')[0],
          duration_minutes: Math.floor(Math.random() * 60) + 15,
          pages_read: Math.floor(Math.random() * 30) + 5,
        });
      }
    }
    await supabase.from('reading_sessions').insert(sessions);

    // 5. 노트 샘플 생성 (notes)
    const notes = [
      {
        user_id: user.id,
        isbn13: dummyBooks[0].isbn13,
        chapter: '1장. 설계와 아키텍처란?',
        content: '아키텍처의 목표는 시스템을 만드는 데 드는 인적 자원을 최소화하는 것이다. \n\n결국 소프트웨어를 유연하게 만드는 것이 핵심이라는 것을 명심하자.',
        quote: '빨리 가는 유일한 방법은 제대로 가는 것이다.',
        tags: ['아키텍처', '설계원칙'],
      },
      {
        user_id: user.id,
        isbn13: dummyBooks[2].isbn13,
        chapter: '2장. 코드를 신속하게 읽기',
        content: '인간의 단기 기억은 한계가 있다. 청킹(Chunking)을 통해 기억 단위를 묶는 것이 중요하다. \n디자인 패턴을 배우면 코드를 청크 단위로 읽을 수 있게 된다.',
        quote: '전문가는 초보자보다 코드를 더 잘 기억하는데, 이는 단순히 기억력이 좋아서가 아니라 지식을 청크로 묶어 처리하기 때문이다.',
        tags: ['인지과학', '청킹'],
      }
    ];
    await supabase.from('notes').insert(notes);

    // 6. 사용자 목표 업데이트 (profiles)
    await supabase.from('profiles').update({ yearly_goal: 50 }).eq('id', user.id);

    return NextResponse.json({ success: true, message: '더미 데이터가 성공적으로 생성되었습니다. 대시보드로 이동하세요!' });
  } catch (error: any) {
    console.error('더미 데이터 생성 오류:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
