import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import React from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

// 세후월배당₩ 파이차트 컴포넌트
// props: data [{ label: string, value: number }]
export default function MonthlyDividendChart({ data }: { data: { label: string, value: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-center">데이터 없음</div>;
  }
  return (
    <Pie
      data={{
        labels: data.map(d => d.label),
        datasets: [
          {
            data: data.map(d => d.value),
            backgroundColor: [
              '#60a5fa', '#facc15', '#34d399', '#f472b6', '#f87171', '#a78bfa', '#38bdf8', '#fbbf24', '#4ade80', '#818cf8', '#fca5a5', '#fcd34d'
            ],
            borderColor: '#22223b',
            borderWidth: 2,
          },
        ],
      }}
      options={{
        plugins: {
          legend: {
            labels: {
              color: '#fff',
              font: { size: 14 },
            },
          },
        },
      }}
      className="w-full h-full"
    />
  );
} 