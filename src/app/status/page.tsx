"use client"
import { useState, useEffect } from "react";
// idb-keyval 라이브러리로 indexedDB 사용
import { get, set, update, del } from "idb-keyval";
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);
import PortfolioPieChart from '../components/PortfolioPieChart';
import MonthlyDividendChart from '../components/MonthlyDividendChart';

// 파일 저장용 key
const FILES_KEY = "portfolio-files";

export default function StatusPage() {
  // 데이터 상태를 빈 배열로 초기화
  const [data, setData] = useState<any[]>([]);
  const [modal, setModal] = useState<{ open: boolean; msg: string; type: string; onConfirm: (() => void) | null }>({ open: false, msg: "", type: "info", onConfirm: null });
  // 포트폴리오 파일 저장/목록/보기/삭제 상태
  const [fileName, setFileName] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [viewFile, setViewFile] = useState<any|null>(null); // 보기용 파일 데이터
  const [editFileId, setEditFileId] = useState<string|null>(null);
  const [editFileName, setEditFileName] = useState("");

  // 마운트 시 indexedDB에서 데이터 불러오기
  useEffect(() => {
    (async () => {
      const items = await get("portfolio-items");
      if (Array.isArray(items)) {
        setData(items);
      } else {
        setData([]);
      }
    })();
  }, []);

  // 파일 목록 불러오기
  useEffect(() => {
    (async () => {
      const files = await get(FILES_KEY);
      if (Array.isArray(files)) setFileList(files);
      else setFileList([]);
    })();
  }, [modal.open]); // 파일 저장/삭제/수정/보기 후 갱신

  // 삭제 버튼 클릭
  const handleDelete = (id: number) => {
    setModal({
      open: true,
      msg: "정말 삭제하시겠습니까?",
      type: "confirm",
      onConfirm: async () => {
        const newData = data.filter((row) => row.id !== id);
        setData(newData);
        await set("portfolio-items", newData); // indexedDB에서도 동기화
        setModal({ open: true, msg: "삭제가 완료되었습니다.", type: "success", onConfirm: null });
      },
    });
  };
  // 모달 닫기
  const closeModal = () => {
    setModal({ open: false, msg: "", type: "info", onConfirm: null });
  };

  // 합계 계산 함수
  const sum = (field: string) => {
    return data.reduce((acc, row) => {
      // 숫자/콤마/문자열 모두 처리
      const val = row[field] ?? row[field.replace('monthlyDividend', 'preDiv').replace('investRatio', 'ratio')];
      if (!val) return acc;
      // %, ₩, $ 등 기호 제거 후 숫자 변환
      const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  };

  // 투자비중(%) 합계 계산 함수
  const sumRatio = () => {
    const total = data.reduce((acc, row) => {
      const val = row.investRatio ?? row.ratio;
      if (!val) return acc;
      // '18%' 등에서 숫자만 추출
      const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    return total ? total.toLocaleString() + '%' : '';
  };

  // 파일 저장
  const handleFileSave = async () => {
    if (!fileName.trim()) return;
    const files = (await get(FILES_KEY)) || [];
    // 현재 테이블 데이터 fetch
    const items = await get("portfolio-items");
    const now = new Date();
    const newFile = {
      id: Date.now().toString(),
      name: fileName.trim(),
      savedAt: now.toLocaleString(),
      data: Array.isArray(items) ? items : [],
    };
    files.push(newFile);
    await set(FILES_KEY, files);
    setFileName("");
    setModal({ open: true, msg: "포트폴리오가 저장되었습니다.", type: "success", onConfirm: null });
  };
  // 파일 삭제
  const handleFileDelete = async (id: string) => {
    setModal({
      open: true,
      msg: "정말 삭제하시겠습니까?",
      type: "confirm",
      onConfirm: async () => {
        const files = (await get(FILES_KEY)) || [];
        const newFiles = files.filter((f: any) => f.id !== id);
        await set(FILES_KEY, newFiles);
        setFileList(newFiles);
        setModal({ open: true, msg: "삭제가 완료되었습니다.", type: "success", onConfirm: null });
      },
    });
  };
  // 파일명 인라인 수정
  const handleFileNameEdit = (id: string, name: string) => {
    setEditFileId(id);
    setEditFileName(name);
  };
  const handleFileNameSave = async (id: string) => {
    const files = (await get(FILES_KEY)) || [];
    const newFiles = files.map((f: any) => f.id === id ? { ...f, name: editFileName } : f);
    await set(FILES_KEY, newFiles);
    setFileList(newFiles);
    setEditFileId(null);
    setEditFileName("");
  };
  // 파일 보기(모달)
  const handleFileView = (file: any) => {
    setViewFile(file);
  };
  // 파일 보기 모달 닫기
  const closeViewFile = () => setViewFile(null);

  // 차트 데이터 생성
  const chartDataRatio = data
    .filter(row => row.ticker && (row.investRatio ?? row.ratio))
    .map(row => ({
      label: row.ticker,
      value: parseFloat((row.investRatio ?? row.ratio).toString().replace(/[^\d.-]/g, '')) || 0
    }));
  const chartDataDividend = data
    .filter(row => row.ticker && (row.monthlyDividendKrwPost ?? row.postDivKrw))
    .map(row => ({
      label: row.ticker,
      value: parseFloat((row.monthlyDividendKrwPost ?? row.postDivKrw).toString().replace(/[^\d.-]/g, '')) || 0
    }));
  // 디버깅용 콘솔 출력
  console.log('투자비중 차트 데이터:', chartDataRatio);
  console.log('세후월배당₩ 차트 데이터:', chartDataDividend);

  return (
    <div className="w-full">
      <h1 className="page-title">자료현황</h1>
      <div className="page-desc">입력된 포트폴리오 및 배당 데이터 현황을 확인할 수 있습니다.</div>
      <div className="divider" />
      {/* 2단: 테이블 리스트 */}
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">티커명</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">현재주가</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">수량</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">주당배당금</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">달러투자금</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">원화투자금</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">투자비중</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">세전월배당$</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">세전월배당₩</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">세후월배당$</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-yellow-300 border-b border-gray-600">세후월배당₩</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-yellow-300 border-b border-gray-600">삭제</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center text-gray-400 py-8">데이터가 없습니다.</td>
              </tr>
            )}
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-700 transition">
                <td className="px-4 py-2 text-white">{row.ticker}</td>
                <td className="px-4 py-2 text-white text-right">{row.price}</td>
                <td className="px-4 py-2 text-white text-right">{row.quantity}</td>
                <td className="px-4 py-2 text-white text-right">{row.monthlyDividend ?? row.dividend}</td>
                <td className="px-4 py-2 text-white text-right">{row.investUsd ?? row.investUsd}</td>
                <td className="px-4 py-2 text-white text-right">{row.investKrw ?? row.investKrw}</td>
                <td className="px-4 py-2 text-white text-right">{row.investRatio ?? row.ratio}</td>
                <td className="px-4 py-2 text-white text-right">{row.monthlyDividendUsdPre ?? row.preDivUsd}</td>
                <td className="px-4 py-2 text-white text-right">{row.monthlyDividendKrwPre ?? row.preDivKrw}</td>
                <td className="px-4 py-2 text-white text-right">{row.monthlyDividendUsdPost ?? row.postDivUsd}</td>
                <td className="px-4 py-2 text-white text-right">{row.monthlyDividendKrwPost ?? row.postDivKrw}</td>
                <td className="px-4 py-2 text-center">
                  <button className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" onClick={() => handleDelete(row.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* 합계 행은 tbody 바깥, table의 마지막에 위치 */}
          <tfoot>
            <tr className="bg-gray-900">
              <td className="px-4 py-2 text-yellow-300 font-bold">합계</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold"></td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('quantity').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold"></td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('investUsd').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('investKrw').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sumRatio()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('monthlyDividendUsdPre').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('monthlyDividendKrwPre').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('monthlyDividendUsdPost').toLocaleString()}</td>
              <td className="px-4 py-2 text-yellow-200 text-right font-bold">{sum('monthlyDividendKrwPost').toLocaleString()}</td>
              <td className="px-4 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* 3단: 포트폴리오 저장 */}
      <div className="w-full bg-gray-800 rounded-lg p-8 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">포트폴리오 저장</h2>
        {/* 파일명 입력 및 저장, 파일 목록, 파일 보기 모달 ... */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFileSave(); }}
            placeholder="파일명을 입력하세요"
            className="flex-1 px-3 py-2 rounded border border-gray-500 bg-gray-900 text-white outline-none"
          />
          <button
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
            onClick={handleFileSave}
          >저장</button>
        </div>
        <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-bold text-yellow-300">파일명</th>
              <th className="px-4 py-2 text-left text-sm font-bold text-yellow-300">저장일시</th>
              <th className="px-4 py-2 text-center text-sm font-bold text-yellow-300">관리</th>
            </tr>
          </thead>
          <tbody>
            {fileList.length === 0 && (
              <tr><td colSpan={3} className="text-center text-gray-400 py-6">저장된 파일이 없습니다.</td></tr>
            )}
            {fileList.map((file) => (
              <tr key={file.id} className="hover:bg-gray-800 transition">
                <td className="px-4 py-2">
                  {editFileId === file.id ? (
                    <input
                      value={editFileName}
                      onChange={e => setEditFileName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleFileNameSave(file.id); }}
                      className="px-2 py-1 rounded bg-gray-700 text-white"
                      autoFocus
                    />
                  ) : (
                    <span>{file.name}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-300">{file.savedAt}</td>
                <td className="px-4 py-2 text-center">
                  {editFileId === file.id ? (
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 mr-2" onClick={() => handleFileNameSave(file.id)}>저장</button>
                  ) : (
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 mr-2" onClick={() => handleFileNameEdit(file.id, file.name)}>파일변경</button>
                  )}
                  <button className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 mr-2" onClick={() => handleFileView(file)}>보기</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" onClick={() => handleFileDelete(file.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {viewFile && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="bg-white text-black rounded-lg p-8 shadow-lg min-w-[900px] max-w-4xl max-h-[80vh] overflow-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">{viewFile.name} (저장일시: {viewFile.savedAt})</div>
                <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={closeViewFile}>닫기</button>
              </div>
              <table className="min-w-full bg-gray-100 rounded-lg overflow-hidden text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border-b">티커명</th>
                    <th className="px-2 py-1 border-b">현재주가</th>
                    <th className="px-2 py-1 border-b">수량</th>
                    <th className="px-2 py-1 border-b">주당배당금</th>
                    <th className="px-2 py-1 border-b">달러투자금</th>
                    <th className="px-2 py-1 border-b">원화투자금</th>
                    <th className="px-2 py-1 border-b">투자비중</th>
                    <th className="px-2 py-1 border-b">세전월배당$</th>
                    <th className="px-2 py-1 border-b">세전월배당₩</th>
                    <th className="px-2 py-1 border-b">세후월배당$</th>
                    <th className="px-2 py-1 border-b">세후월배당₩</th>
                  </tr>
                </thead>
                <tbody>
                  {viewFile.data.length === 0 && (
                    <tr><td colSpan={11} className="text-center text-gray-400 py-4">데이터가 없습니다.</td></tr>
                  )}
                  {viewFile.data.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-200">
                      <td className="px-2 py-1">{row.ticker}</td>
                      <td className="px-2 py-1 text-right">{row.price}</td>
                      <td className="px-2 py-1 text-right">{row.quantity}</td>
                      <td className="px-2 py-1 text-right">{row.monthlyDividend ?? row.dividend}</td>
                      <td className="px-2 py-1 text-right">{row.investUsd ?? row.investUsd}</td>
                      <td className="px-2 py-1 text-right">{row.investKrw ?? row.investKrw}</td>
                      <td className="px-2 py-1 text-right">{row.investRatio ?? row.ratio}</td>
                      <td className="px-2 py-1 text-right">{row.monthlyDividendUsdPre ?? row.preDivUsd}</td>
                      <td className="px-2 py-1 text-right">{row.monthlyDividendKrwPre ?? row.preDivKrw}</td>
                      <td className="px-2 py-1 text-right">{row.monthlyDividendUsdPost ?? row.postDivUsd}</td>
                      <td className="px-2 py-1 text-right">{row.monthlyDividendKrwPost ?? row.postDivKrw}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200">
                    <td className="px-2 py-1 font-bold">합계</td>
                    <td className="px-2 py-1 text-right font-bold"></td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.quantity).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold"></td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.investUsd ?? r.investUsd).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.investKrw ?? r.investKrw).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold">{(() => {
                      const total = viewFile.data.reduce((a: number, r: any) => {
                        const val = r.investRatio ?? r.ratio;
                        if (!val) return a;
                        const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
                        return a + (isNaN(num) ? 0 : num);
                      }, 0);
                      return total ? total.toLocaleString() + '%' : '';
                    })()}</td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.monthlyDividendUsdPre ?? r.preDivUsd).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.monthlyDividendKrwPre ?? r.preDivKrw).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.monthlyDividendUsdPost ?? r.postDivUsd).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-1 text-right font-bold">{viewFile.data.reduce((a: number, r: any) => a + (parseFloat(String(r.monthlyDividendKrwPost ?? r.postDivKrw).replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* 4단: 포트폴리오 챠트(투자비중/세후월배당) */}
      <div className="w-full mt-8">
        {/* 투자비중 차트 */}
        <div className="bg-gray-800 rounded-lg p-8 mb-4">
          <h2 className="text-xl font-bold text-white mb-4">포트폴리오 챠트</h2>
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center justify-center w-full">
            <div className="text-base font-semibold text-white mb-4">티커명 대비 투자비중</div>
            <div className="w-60 h-60 flex items-center justify-center">
              <PortfolioPieChart data={chartDataRatio} />
            </div>
          </div>
        </div>
        {/* 세후월배당 차트 */}
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center justify-center w-full">
            <div className="text-base font-semibold text-white mb-4">티커명 대비 세후월배당₩</div>
            <div className="w-60 h-60 flex items-center justify-center">
              <MonthlyDividendChart data={chartDataDividend} />
            </div>
          </div>
        </div>
      </div>
      {/* 예쁜 모달 */}
      {modal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black rounded-lg p-8 shadow-lg min-w-[320px] text-center animate-fade-in">
            <div className="mb-4 text-lg font-semibold">
              {modal.type === "success" && <span className="text-green-600">✔️</span>}
              {modal.type === "info" && <span className="text-blue-600">ℹ️</span>}
              {modal.type === "confirm" && <span className="text-yellow-600">⚠️</span>}
            </div>
            <div className="mb-6 text-base">{modal.msg}</div>
            {modal.type === "confirm" ? (
              <div className="flex justify-center gap-4">
                <button className="px-6 py-2 bg-red-600 text-white rounded" onClick={() => { if (modal.onConfirm) modal.onConfirm(); closeModal(); }}>확인</button>
                <button className="px-6 py-2 bg-gray-400 text-white rounded" onClick={closeModal}>취소</button>
              </div>
            ) : (
              <button className="px-6 py-2 bg-blue-600 text-white rounded" onClick={closeModal}>확인</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 