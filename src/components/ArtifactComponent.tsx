// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';

// interface ArtifactComponentProps {
//   initialCode?: string;
//   isDevelopment?: boolean;
// }

// // 기본 예시 코드 (개발환경에서 테스트용)
// const defaultCode = `function DataVisualization() {
//   const { useState, useEffect, useMemo } = React;
  
//   const sampleData = [
//     { 월: '1월', 사망: 1, 부상: 3, 고의: 0, 오발: 4, 엽총: 2, 공기총: 1, 기타총: 1 },
//     { 월: '2월', 사망: 0, 부상: 2, 고의: 1, 오발: 1, 엽총: 0, 공기총: 2, 기타총: 0 },
//     { 월: '3월', 사망: 2, 부상: 1, 고의: 0, 오발: 3, 엽총: 1, 공기총: 1, 기타총: 1 },
//     { 월: '4월', 사망: 1, 부상: 4, 고의: 2, 오발: 3, 엽총: 3, 공기총: 2, 기타총: 0 },
//     { 월: '5월', 사망: 0, 부상: 1, 고의: 0, 오발: 1, 엽총: 0, 공기총: 1, 기타총: 0 },
//     { 월: '6월', 사망: 1, 부상: 2, 고의: 1, 오발: 2, 엽총: 2, 공기총: 1, 기타총: 0 },
//     { 월: '7월', 사망: 0, 부상: 3, 고의: 0, 오발: 3, 엽총: 1, 공기총: 2, 기타총: 0 },
//     { 월: '8월', 사망: 2, 부상: 1, 고의: 1, 오발: 2, 엽총: 2, 공기총: 0, 기타총: 1 },
//     { 월: '9월', 사망: 1, 부상: 2, 고의: 0, 오발: 3, 엽총: 1, 공기총: 2, 기타총: 0 },
//     { 월: '10월', 사망: 0, 부상: 2, 고의: 1, 오발: 1, 엽총: 0, 공기총: 2, 기타총: 0 },
//     { 월: '11월', 사망: 1, 부상: 1, 고의: 0, 오발: 2, 엽총: 1, 공기총: 1, 기타총: 0 },
//     { 월: '12월', 사망: 0, 부상: 1, 고의: 0, 오발: 1, 엽총: 0, 공기총: 1, 기타총: 0 }
//   ];

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setTimeout(() => {
//       setData(sampleData);
//       setLoading(false);
//     }, 1000);
//   }, []);

//   const stats = useMemo(() => {
//     if (!data.length) return {};
    
//     const totalDeaths = data.reduce((sum, item) => sum + item.사망, 0);
//     const totalInjuries = data.reduce((sum, item) => sum + item.부상, 0);
//     const totalIntentional = data.reduce((sum, item) => sum + item.고의, 0);
//     const totalAccidental = data.reduce((sum, item) => sum + item.오발, 0);
    
//     return {
//       totalDeaths,
//       totalInjuries,
//       totalIncidents: totalDeaths + totalInjuries,
//       intentionalRate: totalIntentional / (totalIntentional + totalAccidental) * 100,
//       monthlyAvg: (totalDeaths + totalInjuries) / data.length
//     };
//   }, [data]);

//   function BarChart({ title, dataKey, color }) {
//     const maxValue = Math.max(...data.map(item => item[dataKey]), 1);
    
//     return React.createElement('div', {
//       className: 'bg-white rounded-lg p-6 shadow-sm border'
//     }, [
//       React.createElement('h3', {
//         key: 'title',
//         className: 'text-lg font-semibold text-gray-800 mb-4'
//       }, title),
//       React.createElement('div', {
//         key: 'chart',
//         className: 'space-y-3'
//       }, data.map((item, index) => {
//         const percentage = (item[dataKey] / maxValue) * 100;
        
//         return React.createElement('div', {
//           key: index,
//           className: 'flex items-center justify-between'
//         }, [
//           React.createElement('span', {
//             key: 'month',
//             className: 'text-sm text-gray-600 w-12'
//           }, item.월),
//           React.createElement('div', {
//             key: 'bar-container',
//             className: 'flex-1 mx-3 h-6 bg-gray-100 rounded-full overflow-hidden'
//           }, React.createElement('div', {
//             className: 'h-full rounded-full transition-all duration-500 ease-out',
//             style: {
//               backgroundColor: color,
//               width: \`\${percentage}%\`
//             }
//           })),
//           React.createElement('span', {
//             key: 'value',
//             className: 'text-sm font-semibold w-8 text-right'
//           }, item[dataKey])
//         ]);
//       }))
//     ]);
//   }

//   if (loading) {
//     return React.createElement('div', {
//       className: 'min-h-screen bg-gray-50 flex items-center justify-center'
//     }, React.createElement('div', {
//       className: 'text-center'
//     }, [
//       React.createElement('div', {
//         key: 'spinner',
//         className: 'w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'
//       }),
//       React.createElement('p', {
//         key: 'text',
//         className: 'text-gray-600'
//       }, '데이터를 불러오는 중...')
//     ]));
//   }

//   return React.createElement('div', {
//     className: 'min-h-screen bg-gray-50 p-6'
//   }, React.createElement('div', {
//     className: 'max-w-7xl mx-auto'
//   }, [
//     React.createElement('header', {
//       key: 'header',
//       className: 'text-center mb-8'
//     }, [
//       React.createElement('h1', {
//         key: 'title',
//         className: 'text-4xl font-bold text-gray-800 mb-2'
//       }, '총기사고 분석 대시보드'),
//       React.createElement('p', {
//         key: 'subtitle',
//         className: 'text-gray-600'
//       }, '2017년 경찰청 데이터 기반')
//     ]),

//     React.createElement('div', {
//       key: 'stats',
//       className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'
//     }, [
//       React.createElement('div', {
//         key: 'total',
//         className: 'bg-white rounded-lg p-6 shadow-sm border text-center'
//       }, [
//         React.createElement('h3', {
//           key: 'label',
//           className: 'text-sm text-gray-600 mb-2'
//         }, '전체 사고'),
//         React.createElement('p', {
//           key: 'value',
//           className: 'text-3xl font-bold text-blue-600'
//         }, stats.totalIncidents || 0),
//         React.createElement('p', {
//           key: 'detail',
//           className: 'text-xs text-gray-500 mt-1'
//         }, \`월평균 \${(stats.monthlyAvg || 0).toFixed(1)}건\`)
//       ]),
      
//       React.createElement('div', {
//         key: 'deaths',
//         className: 'bg-white rounded-lg p-6 shadow-sm border text-center'
//       }, [
//         React.createElement('h3', {
//           key: 'label',
//           className: 'text-sm text-gray-600 mb-2'
//         }, '사망자'),
//         React.createElement('p', {
//           key: 'value',
//           className: 'text-3xl font-bold text-red-600'
//         }, stats.totalDeaths || 0),
//         React.createElement('p', {
//           key: 'detail',
//           className: 'text-xs text-gray-500 mt-1'
//         }, \`전체의 \${stats.totalIncidents ? ((stats.totalDeaths / stats.totalIncidents) * 100).toFixed(1) : 0}%\`)
//       ]),
      
//       React.createElement('div', {
//         key: 'injuries',
//         className: 'bg-white rounded-lg p-6 shadow-sm border text-center'
//       }, [
//         React.createElement('h3', {
//           key: 'label',
//           className: 'text-sm text-gray-600 mb-2'
//         }, '부상자'),
//         React.createElement('p', {
//           key: 'value',
//           className: 'text-3xl font-bold text-orange-600'
//         }, stats.totalInjuries || 0),
//         React.createElement('p', {
//           key: 'detail',
//           className: 'text-xs text-gray-500 mt-1'
//         }, \`전체의 \${stats.totalIncidents ? ((stats.totalInjuries / stats.totalIncidents) * 100).toFixed(1) : 0}%\`)
//       ]),
      
//       React.createElement('div', {
//         key: 'accidental',
//         className: 'bg-white rounded-lg p-6 shadow-sm border text-center'
//       }, [
//         React.createElement('h3', {
//           key: 'label',
//           className: 'text-sm text-gray-600 mb-2'
//         }, '오발사고 비율'),
//         React.createElement('p', {
//           key: 'value',
//           className: 'text-3xl font-bold text-purple-600'
//         }, \`\${((1 - (stats.intentionalRate || 0) / 100) * 100).toFixed(1)}%\`),
//         React.createElement('p', {
//           key: 'detail',
//           className: 'text-xs text-gray-500 mt-1'
//         }, '전체 사고 중')
//       ])
//     ]),

//     React.createElement('div', {
//       key: 'charts',
//       className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'
//     }, [
//       React.createElement(BarChart, {
//         key: 'deaths-chart',
//         title: '월별 사망자',
//         dataKey: '사망',
//         color: '#dc2626'
//       }),
//       React.createElement(BarChart, {
//         key: 'injuries-chart',
//         title: '월별 부상자',
//         dataKey: '부상',
//         color: '#ea580c'
//       }),
//       React.createElement(BarChart, {
//         key: 'intentional-chart',
//         title: '고의적 사고',
//         dataKey: '고의',
//         color: '#9333ea'
//       }),
//       React.createElement(BarChart, {
//         key: 'accidental-chart',
//         title: '오발 사고',
//         dataKey: '오발',
//         color: '#2563eb'
//       })
//     ]),

//     React.createElement('div', {
//       key: 'weapons',
//       className: 'bg-white rounded-lg p-6 shadow-sm border mb-8'
//     }, [
//       React.createElement('h2', {
//         key: 'title',
//         className: 'text-xl font-semibold text-gray-800 mb-6'
//       }, '무기 유형별 분석'),
//       React.createElement('div', {
//         key: 'grid',
//         className: 'grid grid-cols-1 md:grid-cols-3 gap-6'
//       }, [
//         React.createElement('div', {
//           key: 'hunting',
//           className: 'text-center p-4 bg-green-50 rounded-lg'
//         }, [
//           React.createElement('h3', {
//             key: 'label',
//             className: 'text-lg font-semibold text-gray-800 mb-2'
//           }, '엽총'),
//           React.createElement('p', {
//             key: 'value',
//             className: 'text-2xl font-bold text-green-600'
//           }, data.reduce((sum, item) => sum + item.엽총, 0))
//         ]),
//         React.createElement('div', {
//           key: 'air',
//           className: 'text-center p-4 bg-blue-50 rounded-lg'
//         }, [
//           React.createElement('h3', {
//             key: 'label',
//             className: 'text-lg font-semibold text-gray-800 mb-2'
//           }, '공기총'),
//           React.createElement('p', {
//             key: 'value',
//             className: 'text-2xl font-bold text-blue-600'
//           }, data.reduce((sum, item) => sum + item.공기총, 0))
//         ]),
//         React.createElement('div', {
//           key: 'other',
//           className: 'text-center p-4 bg-purple-50 rounded-lg'
//         }, [
//           React.createElement('h3', {
//             key: 'label',
//             className: 'text-lg font-semibold text-gray-800 mb-2'
//           }, '기타총'),
//           React.createElement('p', {
//             key: 'value',
//             className: 'text-2xl font-bold text-purple-600'
//           }, data.reduce((sum, item) => sum + item.기타총, 0))
//         ])
//       ])
//     ]),

//     React.createElement('div', {
//       key: 'table',
//       className: 'bg-white rounded-lg p-6 shadow-sm border mb-8'
//     }, [
//       React.createElement('h2', {
//         key: 'title',
//         className: 'text-xl font-semibold text-gray-800 mb-4'
//       }, '월별 상세 통계'),
//       React.createElement('div', {
//         key: 'container',
//         className: 'overflow-x-auto'
//       }, React.createElement('table', {
//         className: 'w-full'
//       }, [
//         React.createElement('thead', {
//           key: 'thead'
//         }, React.createElement('tr', {
//           className: 'border-b bg-gray-50'
//         }, [
//           React.createElement('th', {
//             key: 'h1',
//             className: 'px-4 py-3 text-left text-sm font-medium text-gray-600'
//           }, '월'),
//           React.createElement('th', {
//             key: 'h2',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '사망'),
//           React.createElement('th', {
//             key: 'h3',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '부상'),
//           React.createElement('th', {
//             key: 'h4',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '고의'),
//           React.createElement('th', {
//             key: 'h5',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '오발'),
//           React.createElement('th', {
//             key: 'h6',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '엽총'),
//           React.createElement('th', {
//             key: 'h7',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '공기총'),
//           React.createElement('th', {
//             key: 'h8',
//             className: 'px-4 py-3 text-center text-sm font-medium text-gray-600'
//           }, '기타')
//         ])),
//         React.createElement('tbody', {
//           key: 'tbody'
//         }, data.map((item, index) => React.createElement('tr', {
//           key: index,
//           className: 'border-b hover:bg-gray-50'
//         }, [
//           React.createElement('td', {
//             key: 'c1',
//             className: 'px-4 py-3 text-sm font-medium text-gray-800'
//           }, item.월),
//           React.createElement('td', {
//             key: 'c2',
//             className: 'px-4 py-3 text-center text-sm text-red-600 font-semibold'
//           }, item.사망),
//           React.createElement('td', {
//             key: 'c3',
//             className: 'px-4 py-3 text-center text-sm text-orange-600 font-semibold'
//           }, item.부상),
//           React.createElement('td', {
//             key: 'c4',
//             className: 'px-4 py-3 text-center text-sm text-purple-600 font-semibold'
//           }, item.고의),
//           React.createElement('td', {
//             key: 'c5',
//             className: 'px-4 py-3 text-center text-sm text-blue-600 font-semibold'
//           }, item.오발),
//           React.createElement('td', {
//             key: 'c6',
//             className: 'px-4 py-3 text-center text-sm text-green-600 font-semibold'
//           }, item.엽총),
//           React.createElement('td', {
//             key: 'c7',
//             className: 'px-4 py-3 text-center text-sm text-blue-700 font-semibold'
//           }, item.공기총),
//           React.createElement('td', {
//             key: 'c8',
//             className: 'px-4 py-3 text-center text-sm text-purple-700 font-semibold'
//           }, item.기타총)
//         ])))
//       ]))
//     ]),

//     React.createElement('div', {
//       key: 'insights',
//       className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
//     }, [
//       React.createElement('div', {
//         key: 'key-insights',
//         className: 'bg-white rounded-lg p-6 shadow-sm border'
//       }, [
//         React.createElement('h3', {
//           key: 'title',
//           className: 'text-lg font-semibold text-gray-800 mb-4'
//         }, '주요 인사이트'),
//         React.createElement('ul', {
//           key: 'list',
//           className: 'space-y-3 text-sm text-gray-600'
//         }, [
//           React.createElement('li', {
//             key: 'i1'
//           }, '• 4월이 가장 위험한 달 (총 5건 발생)'),
//           React.createElement('li', {
//             key: 'i2'
//           }, \`• 전체 사고의 \${((1 - (stats.intentionalRate || 0)/100) * 100).toFixed(1)}%가 오발사고\`),
//           React.createElement('li', {
//             key: 'i3'
//           }, \`• 공기총 사고가 가장 많음 (총 \${data.reduce((sum, item) => sum + item.공기총, 0)}건)\`)
//         ])
//       ]),
      
//       React.createElement('div', {
//         key: 'recommendations',
//         className: 'bg-white rounded-lg p-6 shadow-sm border'
//       }, [
//         React.createElement('h3', {
//           key: 'title',
//           className: 'text-lg font-semibold text-gray-800 mb-4'
//         }, '개선 권장사항'),
//         React.createElement('ul', {
//           key: 'list',
//           className: 'space-y-3 text-sm text-gray-600'
//         }, [
//           React.createElement('li', {
//             key: 'r1'
//           }, '• 오발사고 방지를 위한 정기적 교육 실시'),
//           React.createElement('li', {
//             key: 'r2'
//           }, '• 총기 보관 및 관리 시스템 강화'),
//           React.createElement('li', {
//             key: 'r3'
//           }, '• 실시간 모니터링 시스템 구축')
//         ])
//       ])
//     ]),

//     React.createElement('footer', {
//       key: 'footer',
//       className: 'text-center mt-12 py-8 border-t'
//     }, [
//       React.createElement('p', {
//         key: 'title',
//         className: 'text-gray-600'
//       }, '경찰청 총기안전 분석 시스템'),
//       React.createElement('p', {
//         key: 'subtitle',
//         className: 'text-gray-500 text-sm mt-2'
//       }, '2017년 통계 데이터 기반')
//     ])
//   ]));
// }`;

// export default function ArtifactComponent({ 
//   initialCode = '', 
//   isDevelopment = process.env.NODE_ENV === 'development' 
// }: ArtifactComponentProps) {
//   const [code, setCode] = useState(initialCode || (isDevelopment ? defaultCode : ''));
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading] = useState(false);

//   // 간단한 JSX 변환 함수
//   const transformJSX = (code: string): string => {
//     let result = code;
    
//     // 1. 자체 닫힌 태그 처리 (<tag />)
//     result = result.replace(
//       /<([a-zA-Z][a-zA-Z0-9]*)\s*([^<>]*?)\s*\/>/g,
//       (match, tagName, attrs) => {
//         const props = parseJSXAttributes(attrs);
//         return `React.createElement('${tagName}', ${props})`;
//       }
//     );
    
//     // 2. 여는/닫는 태그 쌍 처리 - 가장 안쪽부터 처리
//     let depth = 0;
//     do {
//       depth++;
//       const oldResult = result;
//       result = result.replace(
//         /<([a-zA-Z][a-zA-Z0-9]*)\s*([^<>]*?)>((?:(?!<\1\b)[^<]|<(?!\/?)\1\b)*)()(?=<\/\1>)<\/\1>/g,
//         (match, tagName, attrs, children) => {
//           const props = parseJSXAttributes(attrs);
//           let processedChildren = children.trim();
          
//           if (processedChildren) {
//             // 중괄호로 감싸진 JavaScript 표현식 처리
//             if (processedChildren.startsWith('{') && processedChildren.endsWith('}')) {
//               processedChildren = processedChildren.slice(1, -1);
//               return `React.createElement('${tagName}', ${props}, ${processedChildren})`;
//             }
//             // React.createElement 호출이 포함된 경우
//             else if (processedChildren.includes('React.createElement')) {
//               return `React.createElement('${tagName}', ${props}, ${processedChildren})`;
//             }
//             // 일반 텍스트
//             else {
//               return `React.createElement('${tagName}', ${props}, '${processedChildren.replace(/'/g, "\\'")}')`;
//             }
//           } else {
//             return `React.createElement('${tagName}', ${props})`;
//           }
//         }
//       );
//       if (oldResult === result || depth > 10) break;
//     } while (true);
    
//     return result;
//   };

//   // JSX 속성을 객체로 변환
//   const parseJSXAttributes = (attrs: string): string => {
//     if (!attrs.trim()) return 'null';
    
//     const properties: string[] = [];
    
//     // className 처리
//     const classMatch = attrs.match(/className=["']([^"']*)["']/);
//     if (classMatch) {
//       properties.push(`className: '${classMatch[1]}'`);
//     }
    
//     // style 처리 (객체 형태)
//     const styleMatch = attrs.match(/style=\{([^}]+)\}/);
//     if (styleMatch) {
//       properties.push(`style: ${styleMatch[1]}`);
//     }
    
//     // 이벤트 핸들러 처리
//     const handlerRegex = /on([A-Z][a-zA-Z]*)=\{([^}]+)\}/g;
//     let handlerMatch;
//     while ((handlerMatch = handlerRegex.exec(attrs)) !== null) {
//       const eventName = 'on' + handlerMatch[1];
//       properties.push(`${eventName}: ${handlerMatch[2]}`);
//     }
    
//     // 다른 속성들 (문자열 값)
//     const otherRegex = /([a-zA-Z][a-zA-Z0-9]*)=["']([^"']*)["']/g;
//     let otherMatch;
//     while ((otherMatch = otherRegex.exec(attrs)) !== null) {
//       if (otherMatch[1] !== 'className') {
//         properties.push(`${otherMatch[1]}: '${otherMatch[2]}'`);
//       }
//     }
    
//     // 표현식 속성들 ({} 로 감싸인 것들)
//     const exprRegex = /([a-zA-Z][a-zA-Z0-9]*)=\{([^}]+)\}/g;
//     let exprMatch;
//     while ((exprMatch = exprRegex.exec(attrs)) !== null) {
//       if (!exprMatch[1].startsWith('on') && exprMatch[1] !== 'style') {
//         properties.push(`${exprMatch[1]}: ${exprMatch[2]}`);
//       }
//     }
    
//     return properties.length > 0 ? `{ ${properties.join(', ')} }` : 'null';
//   };

//   // 코드 컴파일 및 렌더링
//   const CompiledComponent = useMemo(() => {
//     if (!code.trim()) return null;

//     try {
//       setError(null);
      
//       let processedCode = code;
      
//       // export 문법 제거
//       processedCode = processedCode.replace(/export\s+default\s+/g, '');
//       processedCode = processedCode.replace(/export\s+/g, '');
      
//       // JSX가 포함되어 있다면 변환
//       if (processedCode.includes('<') && processedCode.includes('>')) {
//         processedCode = transformJSX(processedCode);
//       }
      
//       // 함수 이름 추출을 위한 정규식
//       const functionMatch = processedCode.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
//       const arrowFunctionMatch = processedCode.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=.*?=>/);
      
//       const componentName = functionMatch?.[1] || arrowFunctionMatch?.[1] || 'Component';
      
//       // 동적 컴포넌트 생성
//       const componentFactory = new Function(
//         'React',
//         `
//         const { useState, useEffect, useMemo, useCallback } = React;
        
//         ${processedCode}
        
//         // 추출된 컴포넌트 이름으로 반환
//         if (typeof ${componentName} !== 'undefined') {
//           return ${componentName};
//         }
        
//         // 다른 가능한 컴포넌트 이름들 확인
//         const possibleNames = [
//           'Dashboard', 'Counter', 'TodoList', 'ProfileCard', 
//           'DataTable', 'SimpleChart', 'TabsComponent', 'UserList', 
//           'Component', 'App'
//         ];
        
//         for (const name of possibleNames) {
//           try {
//             const comp = eval(name);
//             if (typeof comp === 'function') {
//               return comp;
//             }
//           } catch (e) {
//             // 이름이 정의되지 않은 경우 무시
//           }
//         }
        
//         throw new Error('컴포넌트를 찾을 수 없습니다. 함수 이름이 대문자로 시작하는지 확인하세요.');
//         `
//       );

//       const Component = componentFactory(React);
//       return Component;
//     } catch (err) {
//       console.error('Compilation error:', err);
//       setError(err instanceof Error ? err.message : '컴파일 오류가 발생했습니다.');
//       return null;
//     }
//   }, [code]);

//   // 개발환경에서 코드 입력 처리
//   const handleCodeChange = (newCode: string) => {
//     setCode(newCode);
//   };

//   // 프로덕션에서 외부 코드 주입을 위한 효과
//   useEffect(() => {
//     if (!isDevelopment && initialCode) {
//       setCode(initialCode);
//     }
//   }, [initialCode, isDevelopment]);

//   return (
//     <div className="w-full">
//       {/* 개발환경에서만 표시되는 코드 입력 영역 */}
//       {isDevelopment && (
//         <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
//           <label htmlFor="code-input" className="block text-sm font-medium text-gray-700 mb-2">
//             React 컴포넌트 코드 입력 (개발환경)
//           </label>
//           <textarea
//             id="code-input"
//             value={code}
//             onChange={(e) => handleCodeChange(e.target.value)}
//             placeholder="React 컴포넌트 코드를 입력하세요..."
//             className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//           <p className="mt-2 text-xs text-gray-500">
//             JSX 또는 React.createElement 형태로 작성하세요. export 문법은 자동으로 제거됩니다.
//           </p>
//         </div>
//       )}

//       {/* 오류 표시 */}
//       {error && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
//           <p className="text-sm text-red-600">
//             <strong>오류:</strong> {error}
//           </p>
//           <details className="mt-2">
//             <summary className="text-xs text-gray-500 cursor-pointer">디버그 정보 보기</summary>
//             <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{error}</pre>
//           </details>
//         </div>
//       )}

//       {/* 컴파일된 컴포넌트 렌더링 영역 */}
//       <div className="border border-gray-200 rounded-lg overflow-hidden">
//         <div className="p-4 bg-white min-h-32">
//           {isLoading ? (
//             <div className="flex items-center justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//               <span className="ml-2 text-gray-600">렌더링 중...</span>
//             </div>
//           ) : CompiledComponent ? (
//             <div className="rendered-component">
//               <CompiledComponent />
//             </div>
//           ) : (
//             <div className="text-center py-8 text-gray-500">
//               {code.trim() ? '컴포넌트를 렌더링할 수 없습니다.' : '렌더링할 코드가 없습니다.'}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 개발환경 표시 */}
//       {isDevelopment && (
//         <div className="mt-2 text-xs text-gray-400 text-center">
//           개발환경 모드 - 프로덕션에서는 백엔드에서 코드를 받아 렌더링합니다.
//         </div>
//       )}
//     </div>
//   );
// }