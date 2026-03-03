import React, { useState } from 'react';
import { Search, AlertCircle, Download, Building2, MapPin } from 'lucide-react';

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

export default function App() {
  const [region, setRegion] = useState('');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<KakaoLocalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() && !region.trim()) return;

    setLoading(true);
    setError(null);

    // Combine region and keyword for better Kakao Local Search results
    const searchQuery = `${region} ${keyword}`.trim();

    try {
      const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
      if (!kakaoKey) {
        throw new Error('카카오 API 키가 설정되지 않았습니다. (VITE_KAKAO_REST_API_KEY 환경변수 필요)');
      }

      const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=15`, {
        headers: {
          "Authorization": `KakaoAK ${kakaoKey}`,
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch data from Kakao API');
      }

      setResults(data.documents || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['업체명', '주소', '연락처'];
    const csvContent = [
      headers.join(','),
      ...results.map(item => {
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
    link.setAttribute('download', `${region}_${keyword}_업체목록.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-8 max-w-[1200px] mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8" />
            <h1 className="text-4xl font-sans font-bold tracking-tight uppercase">Business Crawler</h1>
          </div>
          <p className="font-mono text-sm opacity-60">Powered by Kakao Local API</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="지역 (예: 강남역)"
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
            className="px-6 py-3 bg-black text-white font-mono text-sm uppercase tracking-wider hover:bg-black/80 disabled:opacity-50 transition-colors"
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </form>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 font-sans">오류 발생</h3>
            <p className="text-red-700 font-mono text-sm mt-1">{error}</p>
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

          {results.length === 0 && !loading && !error && (
            <div className="p-12 text-center font-mono text-sm opacity-50">
              지역과 키워드를 입력하고 검색해주세요.
            </div>
          )}

          {loading && (
            <div className="p-12 text-center font-mono text-sm opacity-50 animate-pulse">
              데이터를 수집하고 있습니다...
            </div>
          )}

          {!loading && results.map((item) => (
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

      {results.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-black font-mono text-sm hover:bg-black hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
