import React from 'react';
import Link from 'next/link';
import { Calculator, Database, LineChart, FileSpreadsheet } from 'lucide-react';

const QuickActionGrid: React.FC = () => {
  const quickActions = [
    { 
      title: '표 만들기', 
      subtitle: '"이 마케팅 결과 이미지를 표로 만들어줘"',
      icon: <FileSpreadsheet className="w-6 h-6" />, 
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      accent: 'text-[#005de9]'
    },
    { 
      title: '자연어로 함수 요청', 
      subtitle: '"이 열에서 합계 구해줘"',
      icon: <Calculator className="w-6 h-6" />, 
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      accent: 'text-[#005de9]'
    },
    { 
      title: '함수로 하지 못하는 요청 처리', 
      subtitle: '"현재 코스피 지수 반영해서 정렬해"',
      icon: <Database className="w-6 h-6" />, 
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100', 
      accent: 'text-[#005de9]'
    },
    { 
      title: '그래프 시각화', 
      subtitle: '"코스피 지수 그래프 그려줘"',
      icon: <LineChart className="w-6 h-6" />, 
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      accent: 'text-[#005de9]'
    },
  ];

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">이런 걸 할 수 있어요</h2>
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link href="/ai" key={index}>
            <div className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${action.color}`}>
              <div className="text-center">
                <div className={`${action.accent} mb-4 flex justify-center`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 italic">{action.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActionGrid; 