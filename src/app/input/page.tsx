"use client"
import { useState, useEffect } from "react";
// idb-keyval 라이브러리로 indexedDB 사용
import { set, get, update, del } from "idb-keyval";

// 천단위 구분 함수 (정수, 반올림)
function formatNumber(value: string | number) {
  const num = typeof value === 'number' ? value : parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return '';
  return Math.round(num).toLocaleString();
}
function uncomma(str: string) {
  return str.replace(/,/g, "");
}

// 오른쪽 입력값 상태를 localStorage에 저장/불러오기
const RIGHT_KEY = "portfolio-right";

// 자료입력 페이지
export default function InputPage() {
  // 왼쪽 입력값 상태
  const [form, setForm] = useState({
    ticker: "",
    price: "",
    quantity: "",
    monthlyDividend: "",
    investUsd: "",
    investKrw: "",
    monthlyDividendUsdPre: "",
    monthlyDividendKrwPre: "",
    monthlyDividendUsdPost: "",
    monthlyDividendKrwPost: "",
  });
  // 오른쪽 입력값 상태
  const [right, setRight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(RIGHT_KEY);
      if (saved) return JSON.parse(saved);
    }
    return {
      totalUsd: "",
      totalKrw: "",
      investRatio: "",
      remainUsd: "",
      remainKrw: "",
      fx: "1,400",
      tax: "0.154",
    };
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  // 남은 투자 금액 상태
  const [remain, setRemain] = useState({ usd: '', krw: '' });
  const [isMobile, setIsMobile] = useState(false);

  // right 값이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(RIGHT_KEY, JSON.stringify(right));
    }
  }, [right]);

  // 남은 투자 금액 자동 계산 (indexedDB에서 투자금 합계 fetch)
  useEffect(() => {
    async function calcRemain() {
      const items = await get("portfolio-items");
      let investUsdSum = 0;
      let investKrwSum = 0;
      if (Array.isArray(items)) {
        for (const row of items) {
          // 투자금($), 투자금(₩)에서 숫자만 추출해 합산
          if (row.investUsd) investUsdSum += parseFloat(String(row.investUsd).replace(/[^\d.-]/g, '')) || 0;
          if (row.investKrw) investKrwSum += parseFloat(String(row.investKrw).replace(/[^\d.-]/g, '')) || 0;
        }
      }
      const totalUsd = parseFloat(String(right.totalUsd).replace(/[^\d.-]/g, '')) || 0;
      const fx = parseFloat(String(right.fx).replace(/[^\d.-]/g, '')) || 0;
      const totalKrw = totalUsd * fx;
      setRemain({
        usd: totalUsd ? (totalUsd - investUsdSum).toLocaleString() : '',
        krw: totalKrw ? (totalKrw - investKrwSum).toLocaleString() : '',
      });
    }
    calcRemain();
  }, [right.totalUsd, right.fx, form, modalOpen]); // 예산, 환율, 저장/초기화 등 변경 시 재계산

  // 왼쪽 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 티커명: 영어 대문자만 허용(활성화, 기존대로 유지)
    if (name === "ticker") {
      // 한글 입력 감지
      if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
        setModalMsg('영문으로 전환해서 입력하세요.');
        setModalOpen(true);
        return;
      }
      const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
      setForm({ ...form, [name]: upper });
      return;
    }
    // 주당 월 배당금($): 소수점 포함 숫자 허용
    if (name === "monthlyDividend") {
      // 0, 0.123, 12.34 등 허용
      const valid = value.replace(/[^0-9.]/g, "");
      // 소수점 1개만 허용
      const parts = valid.split('.');
      const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : valid;
      setForm({ ...form, [name]: formatted });
      return;
    }
    // 숫자 입력필드는 천단위 구분 적용
    if (["price", "quantity", "investUsd", "investKrw", "monthlyDividendUsdPre", "monthlyDividendKrwPre", "monthlyDividendUsdPost", "monthlyDividendKrwPost"].includes(name)) {
      setForm({ ...form, [name]: formatNumber(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  // 오른쪽 입력값 변경 핸들러
  const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 천단위 구분 적용, $/₩/% 기호 제거
    let cleanValue = value.replace(/[^\d.]/g, "");
    if (["totalUsd", "fx"].includes(name)) {
      setRight((prev: typeof right) => {
        let next = { ...prev, [name]: formatNumber(cleanValue) };
        // 전체 투자 자산($) 입력 시 원화 자동계산
        if (name === "totalUsd") {
          const usd = parseFloat(uncomma(cleanValue) || "0");
          const fx = parseFloat(uncomma(next.fx) || "0");
          next.totalKrw = usd && fx ? formatNumber((usd * fx).toString()) : "";
        }
        // 환율 변경 시 원화 자동계산
        if (name === "fx") {
          const usd = parseFloat(uncomma(next.totalUsd) || "0");
          const fx = parseFloat(uncomma(cleanValue) || "0");
          next.totalKrw = usd && fx ? formatNumber((usd * fx).toString()) : "";
        }
        return next;
      });
    } else if (name === "tax") {
      setRight((prev: typeof right) => ({ ...prev, [name]: cleanValue }));
    }
  };
  // 투자금($), 투자금(₩) 자동 계산
  const calcInvestUsd = () => {
    const price = parseFloat(uncomma(form.price) || "0");
    const quantity = parseFloat(uncomma(form.quantity) || "0");
    if (!price || !quantity) return "";
    return formatNumber((price * quantity).toString());
  };
  const calcInvestKrw = () => {
    const investUsd = parseFloat(uncomma(calcInvestUsd()) || "0");
    const fx = parseFloat(uncomma(right.fx) || "0");
    if (!investUsd || !fx) return "";
    return formatNumber((investUsd * fx).toString());
  };

  // 투자 비중, 남은 금액 자동계산
  const calcAutoFields = () => {
    const investUsd = parseFloat(uncomma(calcInvestUsd()) || "0");
    const investKrw = parseFloat(uncomma(form.investKrw) || "0");
    const totalUsd = parseFloat(uncomma(right.totalUsd) || "0");
    const totalKrw = parseFloat(uncomma(right.totalKrw) || "0");
    // 투자 비중
    const investRatio = totalUsd ? ((investUsd / totalUsd) * 100).toFixed(2) : "";
    // 남은 투자 금액($)
    const remainUsd = totalUsd ? (totalUsd - investUsd).toString() : "";
    // 남은 투자 금액(₩)
    const remainKrw = totalKrw ? (totalKrw - investKrw).toString() : "";
    return {
      investRatio: investRatio ? formatNumber(investRatio) : "",
      remainUsd: remainUsd ? formatNumber(remainUsd) : "",
      remainKrw: remainKrw ? formatNumber(remainKrw) : "",
    };
  };
  const auto = calcAutoFields();

  // 초기화
  const handleReset = async () => {
    // indexedDB 데이터 전체 삭제
    await del("portfolio-items");
    setForm({
      ticker: "",
      price: "",
      quantity: "",
      monthlyDividend: "",
      investUsd: "",
      investKrw: "",
      monthlyDividendUsdPre: "",
      monthlyDividendKrwPre: "",
      monthlyDividendUsdPost: "",
      monthlyDividendKrwPost: "",
    });
    const resetRight = {
      totalUsd: "",
      totalKrw: "",
      investRatio: "",
      remainUsd: "",
      remainKrw: "",
      fx: "1,400",
      tax: "0.154",
    };
    setRight(resetRight);
    if (typeof window !== "undefined") {
      localStorage.removeItem(RIGHT_KEY);
    }
    setModalMsg('초기화되었습니다.');
    setModalOpen(true);
  };
  // 저장(주식추가)
  const handleSave = async () => {
    try {
      // 저장할 데이터 객체 생성
      const newItem = {
        id: Date.now(),
        ticker: form.ticker,
        price: form.price,
        quantity: form.quantity,
        monthlyDividend: form.monthlyDividend,
        investUsd: calcInvestUsd(),
        investKrw: calcInvestKrw(),
        investRatio: (() => {
          const investUsd = parseFloat(uncomma(calcInvestUsd()) || "0");
          const totalUsd = parseFloat(uncomma(right.totalUsd) || "0");
          if (!investUsd || !totalUsd) return "";
          return Math.round((investUsd / totalUsd) * 100) + "%";
        })(),
        monthlyDividendUsdPre: calcMonthlyDivUsdPre(),
        monthlyDividendKrwPre: calcMonthlyDivKrwPre(),
        monthlyDividendUsdPost: calcMonthlyDivUsdPost(),
        monthlyDividendKrwPost: calcMonthlyDivKrwPost(),
      };
      // 기존 데이터 불러오기 및 추가
      let items = await get("portfolio-items");
      if (!Array.isArray(items)) items = [];
      items.push(newItem);
      await set("portfolio-items", items);
      setModalMsg('저장되었습니다.');
      setModalOpen(true);
      setForm({
        ticker: "",
        price: "",
        quantity: "",
        monthlyDividend: "",
        investUsd: "",
        investKrw: "",
        monthlyDividendUsdPre: "",
        monthlyDividendKrwPre: "",
        monthlyDividendUsdPost: "",
        monthlyDividendKrwPost: "",
      });
    } catch (err) {
      setModalMsg('저장 중 오류가 발생했습니다.');
      setModalOpen(true);
      console.error(err);
    }
  };

  // 월 배당금 자동 계산 함수
  const calcMonthlyDivUsdPre = () => {
    const div = parseFloat(form.monthlyDividend || "0");
    const quantity = parseFloat(uncomma(form.quantity) || "0");
    if (!div || !quantity) return "";
    return formatNumber((div * quantity).toFixed(2));
  };
  const calcMonthlyDivKrwPre = () => {
    const usd = parseFloat(calcMonthlyDivUsdPre().replace(/,/g, "") || "0");
    const fx = parseFloat(uncomma(right.fx) || "0");
    if (!usd || !fx) return "";
    return formatNumber((usd * fx).toFixed(2));
  };
  const calcMonthlyDivUsdPost = () => {
    const usd = parseFloat(calcMonthlyDivUsdPre().replace(/,/g, "") || "0");
    let tax = parseFloat(right.tax || "0");
    if (tax > 1) tax = tax / 100;
    if (!usd) return "";
    return formatNumber((usd * (1 - tax)).toFixed(2));
  };
  const calcMonthlyDivKrwPost = () => {
    const usd = parseFloat(calcMonthlyDivUsdPre().replace(/,/g, "") || "0");
    const fx = parseFloat(uncomma(right.fx) || "0");
    let tax = parseFloat(right.tax || "0");
    if (tax > 1) tax = tax / 100;
    if (!usd || !fx) return "";
    return formatNumber((usd * fx * (1 - tax)).toFixed(2));
  };

  // 티커명, 포트폴리오 투자 예산($) 입력 여부 체크
  const isInputReady = form.ticker && right.totalUsd;

  // 입력필드 포커스 시 안내 모달 표시
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isInputReady) {
      setModalMsg('먼저 "티커명"과 "포트폴리오 투자 예산($)"을 입력해 주세요.');
      setModalOpen(true);
      e.target.blur();
    }
  };

  // 모달 엔터키 닫기 핸들러
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full flex flex-col">
      {/* 페이지 타이틀 및 설명 */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">ETF/배당 포트폴리오 자료입력</h1>
        <p className="text-gray-300 text-base mb-4">포트폴리오에 추가할 ETF/주식의 정보를 입력하세요.</p>
        {/* 모바일 안내 메시지 */}
        {isMobile && (
          <div className="text-yellow-300 text-sm mb-4 font-semibold">(프로폴리오 투자예산($) 입력 후 아래로 스크롤하여 &apos;티커명&apos;을 입력하며 &apos;주당월배당금($)&apos;까지만 입력후 엔터를 누르세요.)</div>
        )}
        <hr className="border-t border-gray-500" />
      </div>
      {/* 반응형: 모바일은 flex-col, 데스크탑은 flex-row */}
      <div className="flex flex-col sm:flex-row gap-8">
        {/* 왼쪽(5) - 포트폴리오 투자 정보 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white mb-10">포트폴리오 투자 정보</h2>
          {/* 1단 */}
          <div className="flex gap-4 mb-12">
            <div className="flex-1">
              <div className="text-sm text-white mb-1">포트폴리오 투자 예산($)</div>
              <input
                name="totalUsd"
                value={right.totalUsd ? `$${right.totalUsd}` : ''}
                onChange={handleRightChange}
                placeholder="포트폴리오 전체자산 입력"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none border-yellow-400"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white mb-1">전체 투자 자산(₩)</div>
              <input
                name="totalKrw"
                value={right.totalKrw ? `₩${right.totalKrw}` : ''}
                readOnly
                placeholder="원화 자산 자동입력"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none bg-gray-700"
              />
            </div>
          </div>
          {/* 2단 */}
          <div className="flex gap-4 mb-12">
            <div className="flex-1">
              <div className="text-sm text-white mb-1">남은 투자 금액($)</div>
              <input
                name="remainUsd"
                value={remain.usd ? `$${remain.usd}` : ''}
                readOnly
                placeholder="남은 달러 투자 금액($)"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none bg-gray-700"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white mb-1">남은 투자 금액(₩)</div>
              <input
                name="remainKrw"
                value={remain.krw ? `₩${remain.krw}` : ''}
                readOnly
                placeholder="남은 원화 투자 금액(₩)"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none bg-gray-700"
              />
            </div>
          </div>
          {/* 3단 */}
          <div className="flex gap-4 mb-12">
            <div className="flex-1">
              <div className="text-sm text-white mb-1">원/달러 환율(₩/$)</div>
              <input
                name="fx"
                value={right.fx ? `₩${right.fx}` : ''}
                onChange={handleRightChange}
                placeholder="1,400"
                className="input-custom w-full px-3 py-2 text-yellow-400 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white mb-1">배당세액(%)</div>
              <input
                name="tax"
                value={right.tax ? `${right.tax}%` : ''}
                onChange={handleRightChange}
                placeholder="0.154"
                className="input-custom w-full px-3 py-2 text-yellow-400 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="decimal"
              />
            </div>
          </div>
          {/* 오른쪽 섹션 하단 회색 점선 구분선 */}
          <div className="w-full border-t border-dotted border-gray-400 my-8" />
          {/* 안내 박스 */}
          <div className="w-full border border-gray-300 rounded-[15px] p-6 mt-6 bg-transparent text-white">
            <div className="text-lg font-bold mb-2">포트폴리오 작성법 안내</div>
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {`- 다음 순서대로 입력하세요.
1. "포트폴리오 투자 예산($)" 입력박스에 원하시는 전체 투자금을 입력하세요.
2. "원/달러 환율(₩/$)" 의 입력박스에 '현재 환율 금액'을 입력하세요.
3. "티커명 신규 입력" 의 "티커명"을 영어 문자로 입력하신 후 '현재 주가, 수량, 주당 월 배당금($)'까지만 입력하신 후 '엔터, 또는 저장' 버튼을 누르시면 됩니다.
4. 입력된 자료는 "자료현황" 페이지에서 확인하시면 됩니다.`}
            </div>
          </div>
        </div>
        {/* 중앙 세로 점선 구분선: 모바일에서는 숨김 */}
        <div className="border-l-2 border-dotted border-gray-400 mx-2 hidden sm:block" />
        {/* 오른쪽(5) - 티커명 신규 입력 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white mb-10">티커명 신규 입력</h2>
          {/* 1단 */}
          <div className="flex gap-4 mb-12">
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">티커명</div>
              <input
                name="ticker"
                value={form.ticker}
                onChange={handleChange}
                placeholder="티커명 (예: AAPL)"
                className="input-custom w-full px-3 py-2 text-yellow-400 text-sm placeholder-gray-400 outline-none border-yellow-400"
                autoComplete="off"
              />
            </div>
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">현재주가($)</div>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="현재주가($)"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
                disabled={!isInputReady}
                onFocus={handleInputFocus}
              />
            </div>
          </div>
          {/* 2단 */}
          <div className="flex gap-4 mb-12">
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">수량</div>
              <input
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="수량"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
                disabled={!isInputReady}
                onFocus={handleInputFocus}
              />
            </div>
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">주당 월 배당금($)</div>
              <input
                name="monthlyDividend"
                value={form.monthlyDividend}
                onChange={handleChange}
                placeholder="주당 월 배당금($)"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
                disabled={!isInputReady}
                onFocus={handleInputFocus}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
          </div>
          {/* 3단 */}
          <div className="flex gap-4 mb-12">
            <div className="flex-1">
              <div className="text-sm text-white mb-1">투자금($)</div>
              <input
                name="investUsd"
                value={calcInvestUsd() ? `$${calcInvestUsd()}` : ''}
                readOnly
                placeholder="투자금($)"
                className="input-custom flex-1 px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white mb-1">투자금(₩)</div>
              <input
                name="investKrw"
                value={calcInvestKrw() ? `₩${calcInvestKrw()}` : ''}
                readOnly
                placeholder="투자금(₩)"
                className="input-custom flex-1 px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white mb-1">투자 비중(%)</div>
              <input
                name="investRatioLeft"
                value={(() => {
                  const investUsd = parseFloat(uncomma(calcInvestUsd()) || "0");
                  const totalUsd = parseFloat(uncomma(right.totalUsd) || "0");
                  if (!investUsd || !totalUsd) return "";
                  return Math.round((investUsd / totalUsd) * 100) + "%";
                })()}
                readOnly
                placeholder="투자 비중(%)"
                className="input-custom flex-1 px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
                tabIndex={0}
              />
            </div>
          </div>
          {/* 4단 */}
          <div className="flex gap-4 mb-12">
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">월 배당금($)세전</div>
              <input
                name="monthlyDividendUsdPre"
                value={calcMonthlyDivUsdPre() ? `$${calcMonthlyDivUsdPre()}` : ''}
                readOnly
                placeholder="월 배당금($)세전"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">월 배당금(₩)세전</div>
              <input
                name="monthlyDividendKrwPre"
                value={calcMonthlyDivKrwPre() ? `₩${calcMonthlyDivKrwPre()}` : ''}
                readOnly
                placeholder="월 배당금(₩)세전"
                className="input-custom w-full px-3 py-2 text-gray-100 text-sm placeholder-gray-400 text-right outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
          </div>
          {/* 5단 */}
          <div className="flex gap-4 mb-12">
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">월 배당금($)세후</div>
              <input
                name="monthlyDividendUsdPost"
                value={calcMonthlyDivUsdPost() ? `$${calcMonthlyDivUsdPost()}` : ''}
                className="input-custom w-full px-3 py-2 text-yellow-400 text-sm placeholder-gray-400 text-right outline-none"
                readOnly
                placeholder="월 배당금($)세후"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="w-1/2">
              <div className="text-sm text-white mb-1">월 배당금(₩)세후</div>
              <input
                name="monthlyDividendKrwPost"
                value={calcMonthlyDivKrwPost() ? `₩${calcMonthlyDivKrwPost()}` : ''}
                className="input-custom w-full px-3 py-2 text-yellow-400 text-sm placeholder-gray-400 text-right outline-none"
                readOnly
                placeholder="월 배당금(₩)세후"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
          </div>
          {/* 6단: 버튼 */}
          <div className="flex gap-4 mt-12">
            <button
              type="button"
              onClick={handleSave}
              className="py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow flex-1"
            >
              주식추가(저장)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow flex-1"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
      {/* 안내 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black rounded-lg p-8 shadow-lg min-w-[300px] text-center">
            <div className="mb-4">{modalMsg}</div>
            <button className="mt-2 px-6 py-2 bg-blue-600 text-white rounded" onClick={() => setModalOpen(false)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
} 