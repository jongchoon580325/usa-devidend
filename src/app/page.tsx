'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react';
import PortfolioPieChart from './components/PortfolioPieChart';
import MonthlyDividendChart from './components/MonthlyDividendChart';
import { get } from 'idb-keyval';

// 불꽃놀이 효과 훅 (간단 구현)
function useFirework() {
  const fireworkRef = useRef<HTMLDivElement>(null);
  const fire = () => {
    const el = fireworkRef.current;
    if (!el) return;
    // 이미 캔버스 있으면 제거
    const old = el.querySelector('.firework-canvas');
    if (old) (old as HTMLDivElement).remove();
    // 캔버스 생성
    const canvas = document.createElement('div');
    canvas.className = 'firework-canvas';
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';
    el.appendChild(canvas);
    // 파티클 생성
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'firework-particle';
      const colors = ['#facc15', '#ffe066', '#5bc0eb', '#53e69d', '#f472b6', '#f87171'];
      p.style.background = colors[i % colors.length];
      p.style.width = '10px';
      p.style.height = '10px';
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.position = 'absolute';
      p.style.borderRadius = '50%';
      p.style.opacity = '0.8';
      p.style.transform = 'translate(-50%, -50%)';
      p.style.animation = `firework-explode 0.7s cubic-bezier(0.4,0,0.2,1) forwards`;
      p.style.transition = 'opacity 0.3s';
      // 각도별로 이동
      const angle = (i / 18) * 2 * Math.PI;
      const dist = 60 + Math.random() * 30;
      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      p.style.animationDelay = `${(Math.random() * 0.1).toString()}s`;
      canvas.appendChild(p);
    }
    setTimeout(() => {
      canvas.remove();
    }, 800);
  };
  return { fireworkRef, fire };
}

// 홈(메인) 페이지
export default function Home() {
  // 포트폴리오 데이터 상태
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const items = await get('portfolio-items');
      if (Array.isArray(items)) setData(items);
      else setData([]);
    })();
  }, []);
  // 투자비중 차트 데이터
  const chartDataRatio = data
    .filter(row => row.ticker && (row.investRatio ?? row.ratio))
    .map(row => ({
      label: row.ticker,
      value: parseFloat((row.investRatio ?? row.ratio).toString().replace(/[^\d.-]/g, '')) || 0
    }));
  // 세후월배당₩ 차트 데이터
  const chartDataDividend = data
    .filter(row => row.ticker && (row.monthlyDividendKrwPost ?? row.postDivKrw))
    .map(row => ({
      label: row.ticker,
      value: parseFloat((row.monthlyDividendKrwPost ?? row.postDivKrw).toString().replace(/[^\d.-]/g, '')) || 0
    }));

  // 각 카드별 불꽃놀이 훅
  const fw1 = useFirework();
  const fw2 = useFirework();
  const fw3 = useFirework();

  // 카드 네온/불꽃놀이 효과 스타일 추가
  const cardBase =
    'bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow relative transition-all duration-500 hover:shadow-[0_0_16px_#facc15] hover:ring-2 hover:ring-yellow-300/70';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      {/* 앱 소개 및 가치 제안 */}
      <section className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-yellow-300 mb-4 drop-shadow">Smart Dividend Portfolio</h1>
        <p className="text-lg md:text-2xl text-gray-200 mb-4">미국 배당주 ETF/주식의 월 배당 포트폴리오를 쉽고 체계적으로 관리하세요.</p>
        <p className="text-base text-gray-400">배당률, 배당액, 투자 비중, 세후 배당금 등 다양한 지표를 한눈에 비교·분석할 수 있습니다.</p>
      </section>

      {/* 주요 기능 하이라이트 */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 자료입력 카드 */}
        <div className={`${cardBase} relative`}
          ref={fw1.fireworkRef}
          onMouseEnter={fw1.fire}
          onMouseLeave={() => {
            fw1.fireworkRef.current?.querySelectorAll('.firework-particle').forEach(p => p.classList.add('fadeout'));
          }}>
          <span className="text-3xl mb-2">📝</span>
          <div className="font-bold text-white mb-1 text-xl">자료입력</div>
          <div className="text-gray-300 text-sm mb-2 text-center">ETF/주식별 가격, 수량, 배당금 등 입력<br />자동 계산 및 검증</div>
          <Link href="/input" className="text-blue-400 hover:underline text-sm">바로가기</Link>
        </div>
        {/* 자료현황 카드 */}
        <div className={`${cardBase} relative`}
          ref={fw2.fireworkRef}
          onMouseEnter={fw2.fire}
          onMouseLeave={() => {
            fw2.fireworkRef.current?.querySelectorAll('.firework-particle').forEach(p => p.classList.add('fadeout'));
          }}>
          <span className="text-3xl mb-2">📊</span>
          <div className="font-bold text-white mb-1 text-xl">자료현황</div>
          <div className="text-gray-300 text-sm mb-2 text-center">입력된 포트폴리오 데이터<br />실시간 통계/분석</div>
          <Link href="/status" className="text-blue-400 hover:underline text-sm">바로가기</Link>
        </div>
        {/* 자료관리 카드 */}
        <div className={`${cardBase} relative`}
          ref={fw3.fireworkRef}
          onMouseEnter={fw3.fire}
          onMouseLeave={() => {
            fw3.fireworkRef.current?.querySelectorAll('.firework-particle').forEach(p => p.classList.add('fadeout'));
          }}>
          <span className="text-3xl mb-2">⚙️</span>
          <div className="font-bold text-white mb-1 text-xl">자료관리</div>
          <div className="text-gray-300 text-sm mb-2 text-center">포트폴리오 데이터 관리<br />수정/삭제/초기화</div>
          <Link href="/manage" className="text-blue-400 hover:underline text-sm">바로가기</Link>
        </div>
      </section>

      {/* 포트폴리오 작성법 가이드 */}
      <section className="mb-12">
        <div className="border border-gray-300 rounded-2xl p-6 bg-gray-900/60 text-white">
          <div className="text-lg font-bold mb-2 text-yellow-200">포트폴리오 작성 가이드</div>
          <ul className="list-decimal list-inside text-sm leading-relaxed text-gray-200">
            <li>상단 메뉴에서 <b>자료입력</b>을 클릭합니다.</li>
            <li><b>포트폴리오 투자 예산($)</b>에 전체 투자금을 입력합니다.</li>
            <li><b>원/달러 환율(₩/$)</b>에 현재 환율을 입력합니다.</li>
            <li><b>티커명</b>을 영어로 입력 후, <b>현재주가, 수량, 주당 월 배당금($)</b>을 입력합니다.</li>
            <li>엔터 또는 <b>저장</b> 버튼을 누르면 포트폴리오에 추가됩니다.</li>
            <li>입력된 자료는 <b>자료현황</b>에서 확인할 수 있습니다.</li>
          </ul>
        </div>
      </section>

      {/* 예시 데이터 시각화(실제 연동) */}
      <section className="mb-12">
        <div className="text-lg font-bold text-white mb-4">
          포트폴리오 통계 미리보기
          <span className="ml-2 text-base font-normal text-yellow-200 align-middle">(마우스를 챠트 위에 올려 놓으면 통계숫자를 확인할 수 있습니다.)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 투자비중 파이차트 */}
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[220px]">
            <span className="text-2xl text-gray-300 mb-2">📈</span>
            <div className="text-gray-200 text-sm mb-1">투자 비중 파이차트</div>
            <PortfolioPieChart data={chartDataRatio} />
          </div>
          {/* 세후월배당₩ 파이차트 */}
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[220px]">
            <span className="text-2xl text-gray-300 mb-2">🥧</span>
            <div className="text-gray-200 text-sm mb-1">월별 배당금 그래프</div>
            <MonthlyDividendChart data={chartDataDividend} />
          </div>
        </div>
      </section>

      {/* CTA 및 퀵링크 */}
      <section className="text-center mt-16">
        <Link href="/input" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 px-8 rounded-full text-lg shadow transition">지금 포트폴리오 시작하기</Link>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link href="/input" className="text-blue-400 hover:underline text-sm">자료입력</Link>
          <Link href="/status" className="text-blue-400 hover:underline text-sm">자료현황</Link>
          <Link href="/manage" className="text-blue-400 hover:underline text-sm">자료관리</Link>
        </div>
      </section>

      <style jsx global>{`
        .firework-canvas {
          position: absolute;
          left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;
        }
        .firework-particle {
          position: absolute; border-radius: 50%; opacity: 0.8; pointer-events: none; will-change: transform, opacity; transition: opacity 0.5s;
          animation: firework-explode 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .firework-particle.fadeout {
          opacity: 0 !important;
        }
        @keyframes firework-explode {
          0% { transform: scale(0.5) translate(-50%, -50%); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: scale(1.2) translate(calc(var(--tx,0)), calc(var(--ty,0))); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
