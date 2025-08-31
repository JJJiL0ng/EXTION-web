'use client';

import React, { useEffect, useState } from 'react';

interface GridLineProps {
  isVertical?: boolean;
  position: number;
  isActive: boolean;
  cellSize: number;
}

const GridLine: React.FC<GridLineProps> = ({ isVertical, position, isActive, cellSize }) => {
  const style = isVertical 
    ? {
        position: 'absolute' as const,
        left: `${position * cellSize}px`,
        top: 0,
        bottom: 0,
        width: isActive ? '3px' : '1px',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.8)' : '#BEC3C6',
        transition: 'background-color 0.3s ease-out, width 0.3s ease-out',
        boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.6)' : 'none',
        zIndex: isActive ? 10 : 1,
        transform: isActive ? 'translateX(-1px)' : 'translateX(0)', // 중앙 정렬 보정
      }
    : {
        position: 'absolute' as const,
        top: `${position * cellSize}px`,
        left: 0,
        right: 0,
        height: isActive ? '3px' : '1px',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.8)' : '#BEC3C6', // 세로 스캔도 파란색으로 통일
        transition: 'background-color 0.3s ease-out, height 0.3s ease-out',
        boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.6)' : 'none',
        zIndex: isActive ? 10 : 1,
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)', // 중앙 정렬 보정
      };

  return <div style={style} />;
};

const HeroSection = () => {
    const [activeColumn, setActiveColumn] = useState(0);
    const [activeRow, setActiveRow] = useState(0);
    const [isClient, setIsClient] = useState(false);
    
    // 클라이언트 측에서만 실행되도록 보장
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // 뷰포트 크기에 맞춘 그리드 설정 (기본값 설정)
    const cellWidth = 96;
    const cellHeight = 24;
    const viewportWidth = isClient ? window.innerWidth : 1200;
    const viewportHeight = isClient ? window.innerHeight : 800;
    
    const cols = Math.ceil(viewportWidth / cellWidth) + 2;
    const rows = Math.ceil(viewportHeight / cellHeight) + 2;

    // 가로 스캔 (세로 선들의 색상 변경)
    useEffect(() => {
        if (!isClient) return;
        
        const interval = setInterval(() => {
            setActiveColumn(prev => (prev + 1) % cols);
        }, 4000 / cols); // 4초 동안 전체 스캔

        return () => clearInterval(interval);
    }, [cols, isClient]);

    // 세로 스캔 (가로 선들의 색상 변경)
    useEffect(() => {
        if (!isClient) return;
        
        const interval = setInterval(() => {
            setActiveRow(prev => (prev + 1) % rows);
        }, 5000 / rows); // 5초 동안 전체 스캔

        return () => clearInterval(interval);
    }, [rows, isClient]);

    return (
        <section className="min-h-screen bg-gray-50 py-20 relative overflow-hidden flex items-center justify-center">
            {/* 동적 그리드 스캔 배경 - 클라이언트에서만 렌더링 */}
            {isClient && (
                <div className="absolute inset-0 opacity-10">
                    {/* 세로 선들 (가로 스캔) */}
                    {Array.from({ length: cols }, (_, i) => (
                        <GridLine
                            key={`v-${i}`}
                            isVertical={true}
                            position={i}
                            isActive={i === activeColumn}
                            cellSize={cellWidth}
                        />
                    ))}
                    
                    {/* 가로 선들 (세로 스캔) */}
                    {Array.from({ length: rows }, (_, i) => (
                        <GridLine
                            key={`h-${i}`}
                            isVertical={false}
                            position={i}
                            isActive={i === activeRow}
                            cellSize={cellHeight}
                        />
                    ))}
                </div>
            )}

            {/* 서버 사이드 렌더링용 정적 백업 그리드 */}
            {!isClient && (
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #BEC3C6 1px, transparent 1px),
                            linear-gradient(to bottom, #BEC3C6 1px, transparent 1px)
                        `,
                        backgroundSize: '96px 24px' // Excel-like cell proportions (4:1 ratio)
                    }}
                />
            )}

            {/* Main Content */}
            <div
                className="relative z-10 text-center  mx-auto px-4"
                style={{
                    background: 'radial-gradient(circle, rgba(238,242,255,0.85) 0%, rgba(238,242,255,0.6) 60%, rgba(238,242,255,0) 100%)'
                }}
            >
                <h1 className="font-bold text-black leading-none" style={{ fontSize: '92px', letterSpacing: '-0.06em', lineHeight: '0.95em' }}>
                    Just tell Extion
                    {/* <span
                        className="text-7xl border-4 drop-shadow font-extrabold"
                        style={{
                            borderStyle: 'solid',
                            
                            borderColor: '#005de9'
                        }}
                    >
                        Extion
                    </span> */}
                </h1>
                <h2 className="text-5xl font-bold text-black mb-6 leading-none -mt-2">
                    what you want for Cells
                </h2>
                <p className="text-xl md:text-2xl text-gray-900 font-light mb-6">
                    The Cells AI loved by professionals.
                </p>
                
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200">
                        Start for free
                    </button>
                    <button className="bg-transparent hover:bg-gray-100 text-black border-2 border-black px-6 py-2 rounded-full font-medium transition-colors duration-200">
                        Watch video
                    </button>
                </div>

                {/* Demo Video Placeholder */}
                <div className="w-full mx-auto px-4">
                    <div 
                        className="bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center min-h-[400px] resize overflow-auto mx-auto" 
                        style={{ 
                            width: '100%', 
                            height: '400px',
                            maxWidth: '1200px',
                            minWidth: '300px',
                            minHeight: '200px'
                        }}
                    >
                        <div className="text-center pointer-events-none">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium text-lg">Demo Video Placeholder</p>
                            <p className="text-gray-500 text-sm mt-2">Drag corner to resize</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
