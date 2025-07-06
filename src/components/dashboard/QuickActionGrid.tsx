import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, Database, LineChart, FileSpreadsheet, Table, ChevronDown, ChevronRight } from 'lucide-react';

const QuickActionGrid: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 로컬스토리지 키
  const STORAGE_KEY = 'quickActionGrid_isExpanded';

  // 컴포넌트 마운트 시 로컬스토리지에서 상태 불러오기
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

  const quickActions = [
    { 
      title: '표 만들기', 
      subtitle: '"이 마케팅 결과 이미지를 표로 만들어줘"',
      icon: <Table className="w-6 h-6" />, 
      color: 'bg-white border-gray-300 hover:bg-blue-50 hover:border-[#005de9]',
      accent: 'text-gray-500'
    },
    { 
      title: '자연어로 함수 요청', 
      subtitle: '"이 열에서 합계 구해줘"',
      icon: <Calculator className="w-6 h-6" />, 
      color: 'bg-white border-gray-300 hover:bg-blue-50 hover:border-[#005de9]',
      accent: 'text-gray-500'
    },
    { 
      title: '함수로 하지 못하는 요청 처리', 
      subtitle: '"현재 코스피 지수 반영해서 정렬해"',
      icon: <Database className="w-6 h-6" />, 
      color: 'bg-white border-gray-300 hover:bg-blue-50 hover:border-[#005de9]',
      accent: 'text-gray-500'
    },
    { 
      title: '그래프 시각화', 
      subtitle: '"코스피 지수 그래프 그려줘"',
      icon: <LineChart className="w-6 h-6" />, 
      color: 'bg-white border-gray-300 hover:bg-blue-50 hover:border-[#005de9]',
      accent: 'text-gray-500'
    },
  ];

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    // 로컬스토리지에 새로운 상태 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  return (
    <div className="mb-4 w-[100%] mx-auto">
      <div 
        className="flex items-center cursor-pointer mb-4 group"
        onClick={toggleExpanded}
      >
        <div className="mr-2 text-gray-600 group-hover:text-gray-900 transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
          이런 걸 할 수 있어요. 눌러서 실행해보세요.
        </h2>
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link href="/ai" key={index}>
              <div className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-105 ${action.color}`}>
                <div className="text-center">
                  <div className={`${action.accent} mb-2 flex justify-center`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-600 italic">{action.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickActionGrid; 