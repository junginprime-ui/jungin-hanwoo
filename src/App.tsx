import React, { useState } from 'react';
import { Search, AlertCircle, Download, Building2, MapPin, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface KakaoLocalItem {
  id: string;
  place_name: string;
  place_url: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

// 서울시 25개 구의 주요 법정동/행정동 매핑 데이터 (자동 세분화 검색용)
const REGION_MAP: Record<string, string[]> = {
  "강남구": ["역삼동", "개포동", "청담동", "삼성동", "대치동", "신사동", "논현동", "압구정동", "세곡동", "자곡동", "율현동", "일원동", "수서동", "도곡동"],
  "서초구": ["방배동", "양재동", "우면동", "원지동", "잠원동", "반포동", "서초동", "내곡동", "염곡동", "신원동"],
  "송파구": ["잠실동", "신천동", "풍납동", "송파동", "석촌동", "삼전동", "가락동", "문정동", "장지동", "방이동", "오금동", "거여동", "마천동"],
  "영등포구": ["영등포동", "여의도동", "당산동", "도림동", "문래동", "양평동", "양화동", "신길동", "대림동"],
  "마포구": ["아현동", "공덕동", "도화동", "용강동", "마포동", "대흥동", "염리동", "신수동", "창전동", "상수동", "서교동", "동교동", "합정동", "망원동", "연남동", "성산동", "상암동"],
  "용산구": ["후암동", "용산동", "남영동", "청파동", "원효로", "효창동", "용문동", "한강로", "이촌동", "이태원동", "한남동", "서빙고동", "보광동"],
  "성동구": ["왕십리동", "마장동", "사근동", "행당동", "응봉동", "금호동", "옥수동", "성수동", "송정동", "용답동"],
  "종로구": ["청운동", "효자동", "사직동", "삼청동", "부암동", "평창동", "무악동", "교남동", "가회동", "종로1가", "종로2가", "종로3가", "종로4가", "종로5가", "종로6가", "이화동", "혜화동", "창신동", "숭인동"],
  "중구": ["소공동", "회현동", "명동", "필동", "장충동", "광희동", "을지로동", "신당동", "다산동", "약수동", "청구동", "신당5동", "동화동", "황학동", "중림동"],
  "광진구": ["중곡동", "능동", "구의동", "광장동", "자양동", "화양동", "군자동"],
  "동대문구": ["용두동", "제기동", "전농동", "답십리동", "장안동", "청량리동", "회기동", "휘경동", "이문동"],
  "중랑구": ["면목동", "상봉동", "중화동", "묵동", "망우동", "신내동"],
  "성북구": ["성북동", "삼선동", "동선동", "돈암동", "안암동", "보문동", "정릉동", "길음동", "종암동", "월곡동", "장위동", "석관동"],
  "강북구": ["삼양동", "미아동", "송중동", "송천동", "삼각산동", "번동", "수유동", "우이동", "인수동"],
  "도봉구": ["쌍문동", "방학동", "창동", "도봉동"],
  "노원구": ["월계동", "공릉동", "하계동", "상계동", "중계동"],
  "은평구": ["녹번동", "불광동", "갈현동", "구산동", "대조동", "응암동", "역촌동", "신사동", "증산동", "수색동", "진관동"],
  "서대문구": ["천연동", "북아현동", "충현동", "신촌동", "연희동", "홍제동", "홍은동", "남가좌동", "북가좌동"],
  "양천구": ["목동", "신월동", "신정동"],
  "강서구": ["염창동", "등촌동", "화곡동", "우장산동", "가양동", "발산동", "공항동", "방화동"],
  "구로구": ["신도림동", "구로동", "가리봉동", "고척동", "개봉동", "오류동", "수궁동", "항동"],
  "금천구": ["가산동", "독산동", "시흥동"],
  "동작구": ["노량진동", "상도동", "흑석동", "사당동", "대방동", "신대방동"],
  "관악구": ["보라매동", "청림동", "성현동", "행운동", "낙성대동", "청룡동", "은천동", "중앙동", "인헌동", "남현동", "서원동", "신원동", "서림동", "신사동", "신림동", "난향동", "조원동", "미성동", "난곡동"],
  "강동구": ["강일동", "상일동", "명일동", "고덕동", "암사동", "천호동", "성내동", "길동", "둔촌동"]
};

export default function App() {
  const [region, setRegion] = useState('');
  const [keyword, setKeyword] = useState('');
  const [allResults, setAllResults] = useState<KakaoLocalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Helper to expand region input into multiple sub-regions
  const expandRegions = (inputRegion: string): string[] => {
    const cleanInput = inputRegion.trim();
    if (!cleanInput) return [];

    // 1. If user used commas, split by comma
    if (cleanInput.includes(',')) {
      return cleanInput.split(',').map(r => r.trim()).filter(r => r);
    }

    // 2. Check if the input matches a known district (e.g., "강남구" or "서울 강남구")
    for (const [gu, dongs] of Object.entries(REGION_MAP)) {
      if (cleanInput.includes(gu)) {
        // Return array like ["강남구 역삼동", "강남구 개포동", ...]
        return dongs.map(dong => `${cleanInput.replace(gu, '').trim()} ${gu} ${dong}`.trim());
      }
    }

    // 3. Otherwise, just return the input as a single region
    return [cleanInput];
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() && !region.trim()) return;

    setLoading(true);
    setError(null);
    setAllResults([]);
    setCurrentPage(1);

    const subRegions = expandRegions(region);
    let combinedResults: KakaoLocalItem[] = [];

    try {
      const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
      if (!kakaoKey) {
        throw new Error('카카오 API 키가 설정되지 않았습니다. (VITE_KAKAO_REST_API_KEY 환경변수 필요)');
      }

      const fetchPage = async (query: string, page: number) => {
        const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15&page=${page}`, {
          headers: {
            "Authorization": `KakaoAK ${kakaoKey}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch data from Kakao API');
        }
        return data;
      };

      // Loop through each sub-region
      for (let i = 0; i < subRegions.length; i++) {
        const subRegion = subRegions[i];
        const searchQuery = `${subRegion} ${keyword}`.trim();
        
        setSearchProgress(`[${i + 1}/${subRegions.length}] '${subRegion}' 지역 검색 중...`);

        // Fetch first page
        const firstPageData = await fetchPage(searchQuery, 1);
        if (!firstPageData || !firstPageData.documents) continue;

        combinedResults.push(...firstPageData.documents);

        // Fetch remaining pages (max 3 pages per keyword in Kakao API)
        const pageableCount = firstPageData.meta.pageable_count;
        const maxPage = Math.min(Math.ceil(pageableCount / 15), 3);

        if (maxPage > 1) {
          const promises = [];
          for (let p = 2; p <= maxPage; p++) {
            promises.push(fetchPage(searchQuery, p));
          }
          const restPages = await Promise.all(promises);
          restPages.forEach(data => {
            if (data && data.documents) {
              combinedResults.push(...data.documents);
            }
          });
        }
        
        // Add a tiny delay to prevent hitting API rate limits too hard
        if (i < subRegions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Remove duplicates based on Kakao Place ID
      const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
      
      // Sort by place name
      uniqueResults.sort((a, b) => a.place_name.localeCompare(b.place_name));

      setAllResults(uniqueResults);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearchProgress('');
    }
  };

  const exportToCSV = () => {
    if (allResults.length === 0) return;

    const headers = ['업체명', '주소', '연락처'];
    const csvContent = [
      headers.join(','),
      ...allResults.map(item => {
        const name = `"${item.place_name.replace(/"/g, '""')}"`;
        const address = `"${(item.road_address_name || item.address_name).replace(/"/g, '""')}"`;
        const phone = `"${item.phone || 'N/A'}"`;
        return [name, address, phone].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${region}_${keyword}_업체목록_${allResults.length}건.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const totalPages = Math.ceil(allResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = allResults.slice(startIndex, startIndex + itemsPerPage);

  // Generate page numbers to show (max 5 buttons)
  const getPageNumbers = () => {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="min-h-screen p-8 max-w-[1200px] mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8" />
            <h1 className="text-4xl font-sans font-bold tracking-tight uppercase">Business Crawler</h1>
          </div>
          <p className="font-mono text-sm opacity-60">Powered by Kakao Local API (Auto-Segmentation)</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="지역 (예: 강남구)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/20 focus:outline-none focus:border-black font-mono text-sm rounded-none"
            />
          </div>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="업종/키워드 (예: 맛집)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/20 focus:outline-none focus:border-black font-mono text-sm rounded-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-black text-white font-mono text-sm uppercase tracking-wider hover:bg-black/80 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? '검색중...' : '대량 검색'}
          </button>
        </form>
      </header>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 flex items-start gap-3 text-sm font-sans">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 mb-1">💡 대량 수집 팁 (45개 제한 돌파)</p>
          <p className="text-blue-800 leading-relaxed">
            지역에 <strong>'강남구'</strong>, <strong>'서초구'</strong> 등 서울시 구 이름을 입력하면, 앱이 자동으로 해당 구의 <strong>모든 동(역삼동, 대치동 등)을 순회하며 검색</strong>하여 수백 개의 데이터를 한 번에 수집합니다.<br/>
            또는 <strong>'분당구 정자동, 분당구 서현동'</strong>처럼 쉼표(,)로 여러 지역을 직접 입력하여 검색할 수도 있습니다.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 font-sans">오류 발생</h3>
            <p className="text-red-700 font-mono text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {allResults.length > 0 && !loading && !error && (
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="font-mono text-sm">
            총 <span className="font-bold text-lg text-blue-600">{allResults.length}</span>건의 중복 없는 데이터가 수집되었습니다.
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <label>보기 방식:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-black/20 bg-white px-3 py-1.5 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value={15}>15개씩</option>
              <option value={30}>30개씩</option>
              <option value={50}>50개씩</option>
              <option value={100}>100개씩</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white border border-black/20 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="col-header">
            <div>업체명 (Name)</div>
            <div>주소 (Address)</div>
            <div>연락처 (Contact)</div>
          </div>

          {allResults.length === 0 && !loading && !error && (
            <div className="p-12 text-center font-mono text-sm opacity-50">
              지역과 키워드를 입력하고 대량 검색을 시작하세요.
            </div>
          )}

          {loading && (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
              <div className="font-mono text-sm font-bold text-blue-600">
                {searchProgress}
              </div>
              <div className="font-mono text-xs opacity-50">
                세분화된 지역을 순회하며 데이터를 긁어모으고 있습니다. 잠시만 기다려주세요...
              </div>
            </div>
          )}

          {!loading && paginatedResults.map((item) => (
            <div key={item.id} className="data-row group">
              <div className="data-value font-bold font-sans">
                <a href={item.place_url} target="_blank" rel="noreferrer" className="hover:underline">
                  {item.place_name}
                </a>
              </div>
              <div className="data-value text-xs">{item.road_address_name || item.address_name}</div>
              <div className="data-value">{item.phone || <span className="opacity-40">N/A</span>}</div>
            </div>
          ))}
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2 font-mono text-sm">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 border border-black/20 disabled:opacity-30 hover:bg-black/5 transition-colors"
            title="첫 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
            <ChevronLeft className="w-4 h-4 -ml-3" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-black/20 disabled:opacity-30 hover:bg-black/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center border transition-colors ${
                currentPage === page 
                  ? 'border-black bg-black text-white' 
                  : 'border-black/20 hover:bg-black/5'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-black/20 disabled:opacity-30 hover:bg-black/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 border border-black/20 disabled:opacity-30 hover:bg-black/5 transition-colors"
            title="마지막 페이지"
          >
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 -ml-3" />
          </button>
        </div>
      )}

      {allResults.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            전체 {allResults.length}건 CSV 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
