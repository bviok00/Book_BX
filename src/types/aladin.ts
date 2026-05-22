// 알라딘 Open API 응답 타입 정의

// ── 알라딘 검색 API 응답 ──
export interface AladinSearchResponse {
  version: string;
  title: string;
  link: string;
  pubDate: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  searchCategoryId: number;
  searchCategoryName: string;
  item: AladinBookItem[];
}

// ── 개별 도서 아이템 ──
export interface AladinBookItem {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;           // ISBN10
  isbn13: string;         // ISBN13 (주요 사용)
  itemId: number;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  stockStatus: string;
  mileage: number;
  cover: string;          // 표지 이미지 URL
  categoryId: number;
  categoryName: string;   // 예: "국내도서>경제경영>재테크/투자"
  publisher: string;
  salesPoint: number;
  adult: boolean;
  fixedPrice: boolean;
  customerReviewRank: number;
  // 상세 조회 시 추가 필드
  subInfo?: AladinSubInfo;
}

// ── 상세 정보 (ItemLookUp API) ──
export interface AladinSubInfo {
  subTitle?: string;
  originalTitle?: string;
  itemPage?: number;       // 총 페이지 수
  toc?: string;            // HTML 목차 문자열 (파싱 필요)
  packing?: {
    styleDesc: string;
    weight: number;
    sizeDepth: number;
    sizeHeight: number;
    sizeWidth: number;
  };
}

// ── 파싱된 목차 구조 (DB 저장용) ──
export interface ParsedTocItem {
  depth: number;           // 1 = 대목차, 2 = 소목차
  title: string;
  page?: number;
}
