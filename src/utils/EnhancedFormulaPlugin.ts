// import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

// export class EnhancedFormulaPlugin extends FunctionPlugin {
//   static implementedFunctions = {
//     // 데이터베이스 함수들
//     DSUM: {
//       method: 'dsum',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE }, // database
//         { argumentType: FunctionArgumentType.STRING }, // field
//         { argumentType: FunctionArgumentType.RANGE }   // criteria
//       ]
//     },
    
//     DCOUNT: {
//       method: 'dcount',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     },
    
//     DAVERAGE: {
//       method: 'daverage',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     },
    
//     DGET: {
//       method: 'dget',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     },
    
//     DMAX: {
//       method: 'dmax',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     },
    
//     DMIN: {
//       method: 'dmin',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     },
    
//     // 동적 배열 함수들
//     UNIQUE: {
//       method: 'unique',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false }, // by_col
//         { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false }  // exactly_once
//       ]
//     },
    
//     // Excel 스타일 SORT
//     SORT: {
//       method: 'sort',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE },
//         { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 }, // sort_index
//         { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 }  // sort_order
//       ]
//     },
    
//     // Google Sheets 스타일 SORT (3개 매개변수)
//     GSORT: {
//       method: 'gsort',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE }, // data_range
//         { argumentType: FunctionArgumentType.RANGE }, // sort_column_range
//         { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true } // is_ascending
//       ]
//     },
    
//     // 텍스트 함수들
//     TEXTJOIN: {
//       method: 'textjoin',
//       parameters: [
//         { argumentType: FunctionArgumentType.STRING },
//         { argumentType: FunctionArgumentType.BOOLEAN },
//         { argumentType: FunctionArgumentType.RANGE, repeatLastArgs: 1 }
//       ]
//     },
    
//     CONCAT: {
//       method: 'concat',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE, repeatLastArgs: 1 }
//       ]
//     },
    
//     // 확장된 합계 함수
//     SUMX: {
//       method: 'sumx',
//       parameters: [
//         { argumentType: FunctionArgumentType.RANGE }
//       ]
//     }
//   };

//   // === 데이터베이스 함수 구현 ===
  
//   dsum(ast: any, state: any): any {
//     try {
//       const { database, field, criteria } = this.parseDbFunctionArgs(ast, state);
//       if (!database || !field || !criteria) return '#VALUE!';
      
//       const fieldIndex = this.getFieldIndex(database, field);
//       if (fieldIndex === -1) return '#VALUE!';
      
//       const matchingRows = this.getMatchingRows(database, criteria);
      
//       let sum = 0;
//       matchingRows.forEach(rowIndex => {
//         const value = parseFloat(database[rowIndex][fieldIndex]);
//         if (!isNaN(value)) {
//           sum += value;
//         }
//       });
      
//       return sum;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   dcount(ast: any, state: any): any {
//     try {
//       const { database, field, criteria } = this.parseDbFunctionArgs(ast, state);
//       if (!database || !field || !criteria) return '#VALUE!';
      
//       const fieldIndex = this.getFieldIndex(database, field);
//       if (fieldIndex === -1) return '#VALUE!';
      
//       const matchingRows = this.getMatchingRows(database, criteria);
      
//       let count = 0;
//       matchingRows.forEach(rowIndex => {
//         const value = database[rowIndex][fieldIndex];
//         if (value !== null && value !== undefined && value !== '') {
//           const numValue = parseFloat(value);
//           if (!isNaN(numValue)) {
//             count++;
//           }
//         }
//       });
      
//       return count;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   daverage(ast: any, state: any): any {
//     try {
//       const sum = this.dsum(ast, state);
//       const count = this.dcount(ast, state);
      
//       if (typeof sum === 'string' || typeof count === 'string') {
//         return '#VALUE!';
//       }
      
//       if (count === 0) return '#DIV/0!';
      
//       return sum / count;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   dget(ast: any, state: any): any {
//     try {
//       const { database, field, criteria } = this.parseDbFunctionArgs(ast, state);
//       if (!database || !field || !criteria) return '#VALUE!';
      
//       const fieldIndex = this.getFieldIndex(database, field);
//       if (fieldIndex === -1) return '#VALUE!';
      
//       const matchingRows = this.getMatchingRows(database, criteria);
      
//       if (matchingRows.length === 0) return '#N/A';
//       if (matchingRows.length > 1) return '#NUM!';
      
//       return database[matchingRows[0]][fieldIndex];
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   dmax(ast: any, state: any): any {
//     try {
//       const { database, field, criteria } = this.parseDbFunctionArgs(ast, state);
//       if (!database || !field || !criteria) return '#VALUE!';
      
//       const fieldIndex = this.getFieldIndex(database, field);
//       if (fieldIndex === -1) return '#VALUE!';
      
//       const matchingRows = this.getMatchingRows(database, criteria);
      
//       let max = -Infinity;
//       let hasValue = false;
      
//       matchingRows.forEach(rowIndex => {
//         const value = parseFloat(database[rowIndex][fieldIndex]);
//         if (!isNaN(value)) {
//           max = Math.max(max, value);
//           hasValue = true;
//         }
//       });
      
//       return hasValue ? max : 0;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   dmin(ast: any, state: any): any {
//     try {
//       const { database, field, criteria } = this.parseDbFunctionArgs(ast, state);
//       if (!database || !field || !criteria) return '#VALUE!';
      
//       const fieldIndex = this.getFieldIndex(database, field);
//       if (fieldIndex === -1) return '#VALUE!';
      
//       const matchingRows = this.getMatchingRows(database, criteria);
      
//       let min = Infinity;
//       let hasValue = false;
      
//       matchingRows.forEach(rowIndex => {
//         const value = parseFloat(database[rowIndex][fieldIndex]);
//         if (!isNaN(value)) {
//           min = Math.min(min, value);
//           hasValue = true;
//         }
//       });
      
//       return hasValue ? min : 0;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }

//   // === 동적 배열 함수 구현 ===
  
//   unique(ast: any, state: any): any {
//     try {
//       if (!ast?.args?.length) return '#VALUE!';
      
//       const rangeValue = this.evaluateAst(ast.args[0], state);
//       const byCol = ast.args[1] ? Boolean(this.evaluateAst(ast.args[1], state)) : false;
//       const exactlyOnce = ast.args[2] ? Boolean(this.evaluateAst(ast.args[2], state)) : false;
      
//       const data = this.extractDataFromRange(rangeValue, state);
//       if (!data) return '#VALUE!';
      
//       const uniqueValues: any[][] = [];
//       const seen = new Set<string>();
//       const counts = new Map<string, number>();
      
//       // 빈도 계산 (exactlyOnce 옵션용)
//       if (exactlyOnce) {
//         this.flattenArray(data, (item) => {
//           const str = String(item);
//           counts.set(str, (counts.get(str) || 0) + 1);
//         });
//       }
      
//       this.flattenArray(data, (item) => {
//         const str = String(item);
//         if (!seen.has(str)) {
//           if (!exactlyOnce || counts.get(str) === 1) {
//             seen.add(str);
//             uniqueValues.push([item]);
//           }
//         }
//       });
      
//       return uniqueValues.length > 0 ? uniqueValues : [['']];
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   // Excel 스타일 SORT (열 번호 기준)
//   sort(ast: any, state: any): any {
//     try {
//       if (!ast?.args?.length) return '#VALUE!';
      
//       const rangeValue = this.evaluateAst(ast.args[0], state);
//       const sortIndex = ast.args[1] ? Number(this.evaluateAst(ast.args[1], state)) : 1;
//       const sortOrder = ast.args[2] ? Number(this.evaluateAst(ast.args[2], state)) : 1;
      
//       const data = this.extractDataFromRange(rangeValue, state);
//       if (!data || !Array.isArray(data)) return '#VALUE!';
      
//       const sortedData = [...data];
//       const colIndex = sortIndex - 1; // 1-based to 0-based
      
//       sortedData.sort((a, b) => {
//         const aVal = Array.isArray(a) ? a[colIndex] : a;
//         const bVal = Array.isArray(b) ? b[colIndex] : b;
        
//         // 숫자 비교
//         const aNum = parseFloat(aVal);
//         const bNum = parseFloat(bVal);
        
//         if (!isNaN(aNum) && !isNaN(bNum)) {
//           return sortOrder > 0 ? aNum - bNum : bNum - aNum;
//         }
        
//         // 문자열 비교
//         const aStr = String(aVal || '');
//         const bStr = String(bVal || '');
        
//         return sortOrder > 0 ? 
//           aStr.localeCompare(bStr) : 
//           bStr.localeCompare(aStr);
//       });
      
//       return sortedData;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   // Google Sheets 스타일 SORT (범위 기준)
//   gsort(ast: any, state: any): any {
//     try {
//       if (!ast?.args || ast.args.length < 2) return '#VALUE!';
      
//       const dataRange = this.evaluateAst(ast.args[0], state);
//       const sortColumnRange = this.evaluateAst(ast.args[1], state);
//       const isAscending = ast.args[2] ? Boolean(this.evaluateAst(ast.args[2], state)) : true;
      
//       const data = this.extractDataFromRange(dataRange, state);
//       const sortColumn = this.extractDataFromRange(sortColumnRange, state);
      
//       if (!data || !sortColumn) return '#VALUE!';
      
//       // 정렬 열의 값들을 1차원 배열로 변환
//       const sortValues: any[] = [];
//       this.flattenArray(sortColumn, (item) => sortValues.push(item));
      
//       // 데이터 길이와 정렬 값 길이가 맞지 않으면 에러
//       if (data.length !== sortValues.length) return '#VALUE!';
      
//       // 데이터와 정렬 값을 쌍으로 만들어 정렬
//       const pairedData = data.map((row, index) => ({
//         row,
//         sortValue: sortValues[index]
//       }));
      
//       pairedData.sort((a, b) => {
//         const aVal = a.sortValue;
//         const bVal = b.sortValue;
        
//         // 숫자 비교
//         const aNum = parseFloat(aVal);
//         const bNum = parseFloat(bVal);
        
//         if (!isNaN(aNum) && !isNaN(bNum)) {
//           return isAscending ? aNum - bNum : bNum - aNum;
//         }
        
//         // 문자열 비교
//         const aStr = String(aVal || '');
//         const bStr = String(bVal || '');
        
//         return isAscending ? 
//           aStr.localeCompare(bStr) : 
//           bStr.localeCompare(aStr);
//       });
      
//       // 정렬된 행들만 반환
//       return pairedData.map(item => item.row);
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }

//   // === 텍스트 함수 구현 ===
  
//   textjoin(ast: any, state: any): any {
//     try {
//       if (!ast?.args || ast.args.length < 3) return '#VALUE!';
      
//       const delimiter = String(this.evaluateAst(ast.args[0], state) || '');
//       const ignoreEmpty = Boolean(this.evaluateAst(ast.args[1], state));
      
//       const values: string[] = [];
      
//       // 세 번째 인수부터 모든 범위 처리
//       for (let i = 2; i < ast.args.length; i++) {
//         const rangeValue = this.evaluateAst(ast.args[i], state);
//         const data = this.extractDataFromRange(rangeValue, state);
        
//         if (data) {
//           this.flattenArray(data, (item) => {
//             const str = String(item || '');
//             if (!ignoreEmpty || (str !== '' && str !== 'null' && str !== 'undefined')) {
//               values.push(str);
//             }
//           });
//         }
//       }
      
//       return values.join(delimiter);
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   concat(ast: any, state: any): any {
//     try {
//       if (!ast?.args?.length) return '';
      
//       const values: string[] = [];
      
//       for (let i = 0; i < ast.args.length; i++) {
//         const rangeValue = this.evaluateAst(ast.args[i], state);
//         const data = this.extractDataFromRange(rangeValue, state);
        
//         if (data) {
//           this.flattenArray(data, (item) => {
//             values.push(String(item || ''));
//           });
//         }
//       }
      
//       return values.join('');
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }
  
//   // === 확장된 합계 함수 ===
  
//   sumx(ast: any, state: any): any {
//     try {
//       if (!ast?.args?.length) return '#VALUE!';
      
//       const rangeValue = this.evaluateAst(ast.args[0], state);
//       const data = this.extractDataFromRange(rangeValue, state);
      
//       if (!data) return '#VALUE!';
      
//       let sum = 0;
//       this.flattenArray(data, (item) => {
//         const num = parseFloat(item);
//         if (!isNaN(num)) {
//           sum += num;
//         }
//       });
      
//       return sum;
//     } catch (error) {
//       return '#ERROR!';
//     }
//   }

//   // === 유틸리티 함수들 ===
  
//   private parseDbFunctionArgs(ast: any, state: any): { database: any[][], field: any, criteria: any[][] } | { database: null, field: null, criteria: null } {
//     if (!ast?.args || ast.args.length < 3) {
//       return { database: null, field: null, criteria: null };
//     }
    
//     const databaseValue = this.evaluateAst(ast.args[0], state);
//     const fieldValue = this.evaluateAst(ast.args[1], state);
//     const criteriaValue = this.evaluateAst(ast.args[2], state);
    
//     const database = this.extractDataFromRange(databaseValue, state);
//     const criteria = this.extractDataFromRange(criteriaValue, state);
    
//     if (!database || !criteria) {
//       return { database: null, field: null, criteria: null };
//     }
    
//     return { database, field: fieldValue, criteria };
//   }
  
//   public evaluateAst(astNode: any, state: any): any {
//     try {
//       if (this.interpreter && typeof this.interpreter.evaluateAst === 'function') {
//         return this.interpreter.evaluateAst(astNode, state);
//       }
//       return astNode;
//     } catch (error) {
//       return astNode;
//     }
//   }
  
//   private extractDataFromRange(rangeValue: any, state: any): any[][] | null {
//     try {
//       // SimpleRangeValue 객체 처리
//       if (rangeValue && rangeValue.constructor?.name === 'SimpleRangeValue') {
//         return this.extractDataFromSimpleRangeValue(rangeValue);
//       }
      
//       // 이미 배열인 경우
//       if (Array.isArray(rangeValue)) {
//         return rangeValue;
//       }
      
//       // 단일 값인 경우
//       if (rangeValue !== null && rangeValue !== undefined) {
//         return [[rangeValue]];
//       }
      
//       return null;
//     } catch (error) {
//       return null;
//     }
//   }
  
//   private extractDataFromSimpleRangeValue(rangeValue: any): any[][] | null {
//     try {
//       if (rangeValue.range && rangeValue.dependencyGraph) {
//         const range = rangeValue.range;
//         const data: any[][] = [];
        
//         for (let row = range.start.row; row <= range.end.row; row++) {
//           const rowData: any[] = [];
//           for (let col = range.start.col; col <= range.end.col; col++) {
//             try {
//               const address = { sheet: range.start.sheet, col, row };
//               const cell = rangeValue.dependencyGraph.getCell(address);
//               const value = cell ? cell.getCellValue() : '';
//               rowData.push(value);
//             } catch (cellError) {
//               rowData.push('');
//             }
//           }
//           data.push(rowData);
//         }
        
//         return data;
//       }
      
//       return null;
//     } catch (error) {
//       return null;
//     }
//   }
  
//   private getFieldIndex(database: any[][], field: any): number {
//     if (!database || database.length === 0) return -1;
    
//     const headers = database[0];
    
//     // 필드가 숫자인 경우 (열 인덱스)
//     if (typeof field === 'number') {
//       return field - 1; // 1-based to 0-based
//     }
    
//     // 필드가 문자열인 경우 (열 이름)
//     return headers.findIndex(header => 
//       String(header).toLowerCase() === String(field).toLowerCase()
//     );
//   }
  
//   private getMatchingRows(database: any[][], criteria: any[][]): number[] {
//     if (!criteria || criteria.length < 2) {
//       // 조건이 없으면 모든 데이터 행 반환 (헤더 제외)
//       return Array.from({ length: database.length - 1 }, (_, i) => i + 1);
//     }
    
//     const matchingRows: number[] = [];
//     const headers = database[0];
//     const criteriaHeaders = criteria[0];
    
//     // 데이터 행들 검사 (헤더 제외)
//     for (let i = 1; i < database.length; i++) {
//       let rowMatches = false;
      
//       // 각 조건 행 검사
//       for (let j = 1; j < criteria.length; j++) {
//         const criteriaRow = criteria[j];
        
//         // 조건 행의 각 조건 검사 (AND 조건)
//         let allConditionsMet = true;
        
//         for (let k = 0; k < criteriaRow.length; k++) {
//           const criteriaValue = criteriaRow[k];
//           if (!criteriaValue) continue;
          
//           const criteriaField = criteriaHeaders[k];
//           const fieldIndex = this.getFieldIndex(database, criteriaField);
          
//           if (fieldIndex !== -1) {
//             const cellValue = database[i][fieldIndex];
//             if (!this.matchesCriteria(cellValue, criteriaValue)) {
//               allConditionsMet = false;
//               break;
//             }
//           }
//         }
        
//         if (allConditionsMet) {
//           rowMatches = true;
//           break; // OR 조건이므로 하나라도 맞으면 됨
//         }
//       }
      
//       if (rowMatches || criteria.length === 1) {
//         matchingRows.push(i);
//       }
//     }
    
//     return matchingRows;
//   }
  
//   private matchesCriteria(cellValue: any, criteria: any): boolean {
//     const cellStr = String(cellValue || '').toLowerCase();
//     const criteriaStr = String(criteria || '').toLowerCase();
    
//     // 정확한 일치
//     if (cellStr === criteriaStr) return true;
    
//     // 숫자 비교 연산자 처리
//     const operatorMatch = criteriaStr.match(/^([<>=]+)/);
//     if (operatorMatch) {
//       const operator = operatorMatch[1];
//       const value = parseFloat(criteriaStr.replace(/^[<>=]+/, ''));
//       const cellNum = parseFloat(cellValue);
      
//       if (!isNaN(cellNum) && !isNaN(value)) {
//         switch (operator) {
//           case '>': return cellNum > value;
//           case '>=': return cellNum >= value;
//           case '<': return cellNum < value;
//           case '<=': return cellNum <= value;
//           case '=': return cellNum === value;
//           case '<>': return cellNum !== value;
//           default: return false;
//         }
//       }
//     }
    
//     // 와일드카드 패턴 매칭
//     if (criteriaStr.includes('*') || criteriaStr.includes('?')) {
//       const regex = criteriaStr
//         .replace(/\*/g, '.*')
//         .replace(/\?/g, '.');
//       return new RegExp(`^${regex}$`, 'i').test(cellStr);
//     }
    
//     return false;
//   }
  
//   private flattenArray(arr: any, callback: (item: any) => void): void {
//     if (Array.isArray(arr)) {
//       arr.forEach(item => {
//         if (Array.isArray(item)) {
//           this.flattenArray(item, callback);
//         } else {
//           callback(item);
//         }
//       });
//     } else {
//       callback(arr);
//     }
//   }
// }

// // 번역 객체 (다국어 지원)
// export const EnhancedFormulaPluginTranslations = {
//   enGB: {
//     DSUM: 'DSUM',
//     DCOUNT: 'DCOUNT',
//     DAVERAGE: 'DAVERAGE',
//     DGET: 'DGET',
//     DMAX: 'DMAX',
//     DMIN: 'DMIN',
//     UNIQUE: 'UNIQUE',
//     SORT: 'SORT',
//     GSORT: 'GSORT',
//     TEXTJOIN: 'TEXTJOIN',
//     CONCAT: 'CONCAT',
//     SUMX: 'SUMX'
//   },
//   koKR: {
//     DSUM: 'DSUM',
//     DCOUNT: 'DCOUNT',
//     DAVERAGE: 'DAVERAGE',
//     DGET: 'DGET',
//     DMAX: 'DMAX',
//     DMIN: 'DMIN',
//     UNIQUE: 'UNIQUE',
//     SORT: 'SORT',
//     GSORT: 'GSORT',
//     TEXTJOIN: 'TEXTJOIN',
//     CONCAT: 'CONCAT',
//     SUMX: 'SUMX'
//   }
// };

import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

export class EnhancedFormulaPlugin extends FunctionPlugin {
  static implementedFunctions = {
    // 테스트용 함수 - 이름 변경
    HELLO2: {
      method: 'hello2',
      parameters: []
    },
    
    // 새로운 이름으로 텍스트 함수
    MYTEXTJOIN: {
      method: 'mytextjoin',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.BOOLEAN },
        { argumentType: FunctionArgumentType.RANGE }
      ]
    },
    
    // 새로운 이름으로 고유값 함수
    MYUNIQUE: {
      method: 'myunique',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }
      ]
    },
    
    // 새로운 이름으로 합계 함수
    MYSUM2: {
      method: 'mysum2',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }
      ]
    },
    
    // 데이터베이스 함수
    MYDSUM: {
      method: 'mydsum',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }, // database
        { argumentType: FunctionArgumentType.STRING }, // field
        { argumentType: FunctionArgumentType.RANGE }   // criteria
      ]
    }
  };

  // === 테스트용 함수 ===
  hello2(ast: any, state: any): string {
    console.log('HELLO2 함수가 호출되었습니다!');
    console.log('AST:', ast);
    console.log('State type:', typeof state);
    return 'Hello2 from EnhancedFormula!';
  }

  // === 간단한 합계 함수 ===
  mysum2(ast: any, state: any): any {
    console.log('=== MYSUM2 호출 ===');
    console.log('AST:', ast);
    
    try {
      // AST가 없으면 에러
      if (!ast || !ast.args) {
        console.log('AST 또는 args가 없음');
        return '#VALUE!';
      }
      
      const args = ast.args;
      console.log('Args 배열:', args);
      console.log('Args 길이:', args.length);
      
      if (args.length === 0) {
        return 0;
      }
      
      // 첫 번째 인수 분석
      const firstArg = args[0];
      console.log('첫 번째 인수:', firstArg);
      
      // 인수 평가
      let rangeValue;
      if (this.interpreter && typeof this.interpreter.evaluateAst === 'function') {
        console.log('interpreter.evaluateAst 사용');
        rangeValue = this.interpreter.evaluateAst(firstArg, state);
      } else {
        console.log('직접 처리');
        rangeValue = firstArg;
      }
      
      console.log('평가된 범위 값:', rangeValue);
      console.log('평가된 값 타입:', typeof rangeValue);
      console.log('평가된 값 생성자:', rangeValue?.constructor?.name);
      
      // SimpleRangeValue 객체 처리
      if (rangeValue && rangeValue.constructor?.name === 'SimpleRangeValue') {
        console.log('MYSUM2에서 SimpleRangeValue 감지됨');
        const actualData = this.extractDataFromSimpleRangeValue(rangeValue, state);
        console.log('MYSUM2에서 추출된 실제 데이터:', actualData);
        rangeValue = actualData;
      }
      
      // 배열이면 합계 계산
      if (Array.isArray(rangeValue)) {
        let sum = 0;
        let count = 0;
        
        const processValue = (value: any) => {
          console.log(`MYSUM2 값 처리: ${value} (타입: ${typeof value})`);
          const num = parseFloat(value);
          if (!isNaN(num)) {
            sum += num;
            count++;
            console.log(`  -> 누적 합계: ${sum}, 개수: ${count}`);
          }
        };
        
        const processArray = (arr: any[]) => {
          arr.forEach((item, index) => {
            console.log(`MYSUM2 배열[${index}]:`, item);
            if (Array.isArray(item)) {
              processArray(item);
            } else {
              processValue(item);
            }
          });
        };
        
        processArray(rangeValue);
        
        console.log(`MYSUM2 최종 결과: ${sum} (${count}개 값)`);
        return sum;
      } else {
        // 단일 값 처리
        const num = parseFloat(rangeValue);
        const result = isNaN(num) ? 0 : num;
        console.log(`MYSUM2 단일 값 결과: ${result}`);
        return result;
      }
      
    } catch (error) {
      console.error('MYSUM2 오류:', error);
      return '#ERROR!';
    }
  }

  // === 텍스트 결합 함수 ===
  mytextjoin(ast: any, state: any): any {
    console.log('=== MYTEXTJOIN 호출 ===');
    console.log('AST:', ast);
    
    try {
      if (!ast || !ast.args || ast.args.length < 3) {
        console.log('MYTEXTJOIN 매개변수 부족');
        return '#VALUE!';
      }
      
      const args = ast.args;
      console.log('Args:', args);
      
      // 매개변수 평가
      let delimiter, ignoreEmpty, rangeValue;
      
      if (this.interpreter && typeof this.interpreter.evaluateAst === 'function') {
        delimiter = this.interpreter.evaluateAst(args[0], state);
        ignoreEmpty = this.interpreter.evaluateAst(args[1], state);
        rangeValue = this.interpreter.evaluateAst(args[2], state);
      } else {
        delimiter = args[0];
        ignoreEmpty = args[1];
        rangeValue = args[2];
      }
      
      console.log('평가된 매개변수:', { delimiter, ignoreEmpty, rangeValue });
      console.log('rangeValue 타입:', typeof rangeValue);
      console.log('rangeValue 생성자:', rangeValue?.constructor?.name);
      
      // SimpleRangeValue 객체 처리
      if (rangeValue && rangeValue.constructor?.name === 'SimpleRangeValue') {
        console.log('SimpleRangeValue 감지됨');
        console.log('SimpleRangeValue 속성들:', Object.getOwnPropertyNames(rangeValue));
        console.log('range:', rangeValue.range);
        console.log('size:', rangeValue.size);
        
        // SimpleRangeValue에서 실제 데이터 추출 시도
        const actualData = this.extractDataFromSimpleRangeValue(rangeValue, state);
        console.log('추출된 실제 데이터:', actualData);
        rangeValue = actualData;
      }
      
      // 문자열로 변환
      const delimiterStr = String(delimiter || ',');
      const ignoreEmptyBool = Boolean(ignoreEmpty);
      
      console.log('변환된 매개변수:', { delimiterStr, ignoreEmptyBool });
      
      // 텍스트 값 수집
      const values: string[] = [];
      
      const collectValues = (data: any) => {
        console.log('collectValues 처리 중:', data, typeof data);
        
        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            console.log(`배열[${index}]:`, item);
            if (Array.isArray(item)) {
              collectValues(item);
            } else if (item !== null && item !== undefined) {
              const str = String(item);
              console.log(`값 수집: "${str}"`);
              if (!ignoreEmptyBool || (str !== '' && str !== 'null' && str !== 'undefined')) {
                values.push(str);
              }
            }
          });
        } else if (data !== null && data !== undefined) {
          const str = String(data);
          console.log(`단일 값 수집: "${str}"`);
          if (!ignoreEmptyBool || (str !== '' && str !== 'null' && str !== 'undefined')) {
            values.push(str);
          }
        }
      };
      
      collectValues(rangeValue);
      
      console.log('수집된 모든 값:', values);
      const result = values.join(delimiterStr);
      console.log('MYTEXTJOIN 결과:', result);
      
      return result;
    } catch (error) {
      console.error('MYTEXTJOIN 오류:', error);
      return '#ERROR!';
    }
  }

  // === 고유값 함수 ===
  myunique(ast: any, state: any): any {
    console.log('=== MYUNIQUE 호출 ===');
    console.log('AST:', ast);
    
    try {
      if (!ast || !ast.args || ast.args.length === 0) {
        return '#VALUE!';
      }
      
      const firstArg = ast.args[0];
      
      // 범위 값 평가
      let rangeValue;
      if (this.interpreter && typeof this.interpreter.evaluateAst === 'function') {
        rangeValue = this.interpreter.evaluateAst(firstArg, state);
      } else {
        rangeValue = firstArg;
      }
      
      console.log('MYUNIQUE 범위 값:', rangeValue);
      console.log('MYUNIQUE 범위 값 타입:', typeof rangeValue);
      console.log('MYUNIQUE 범위 값 생성자:', rangeValue?.constructor?.name);
      
      // SimpleRangeValue 객체 처리
      if (rangeValue && rangeValue.constructor?.name === 'SimpleRangeValue') {
        console.log('UNIQUE에서 SimpleRangeValue 감지됨');
        const actualData = this.extractDataFromSimpleRangeValue(rangeValue, state);
        console.log('UNIQUE에서 추출된 실제 데이터:', actualData);
        rangeValue = actualData;
      }
      
      const uniqueValues: any[][] = [];
      const seen = new Set<string>();
      
      const processUnique = (data: any) => {
        console.log('UNIQUE processUnique 처리 중:', data, typeof data);
        
        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            console.log(`UNIQUE 배열[${index}]:`, item);
            if (Array.isArray(item)) {
              processUnique(item);
            } else if (item !== null && item !== undefined) {
              const str = String(item);
              if (!seen.has(str)) {
                seen.add(str);
                uniqueValues.push([item]);
                console.log(`고유값 추가: ${item}`);
              }
            }
          });
        } else if (data !== null && data !== undefined) {
          const str = String(data);
          if (!seen.has(str)) {
            seen.add(str);
            uniqueValues.push([data]);
            console.log(`단일 고유값 추가: ${data}`);
          }
        }
      };
      
      processUnique(rangeValue);
      
      console.log('MYUNIQUE 결과:', uniqueValues);
      return uniqueValues.length > 0 ? uniqueValues : [['']];
    } catch (error) {
      console.error('MYUNIQUE 오류:', error);
      return '#ERROR!';
    }
  }

  // === 데이터베이스 DSUM 함수 ===
  mydsum(ast: any, state: any): any {
    console.log('=== MYDSUM 호출 ===');
    console.log('AST:', ast);
    
    try {
      if (!ast || !ast.args || ast.args.length < 3) {
        console.log('MYDSUM 매개변수 부족');
        return '#VALUE!';
      }
      
      const args = ast.args;
      console.log('MYDSUM Args:', args);
      
      // 매개변수 평가
      let databaseValue, fieldValue, criteriaValue;
      
      if (this.interpreter && typeof this.interpreter.evaluateAst === 'function') {
        databaseValue = this.interpreter.evaluateAst(args[0], state);
        fieldValue = this.interpreter.evaluateAst(args[1], state);
        criteriaValue = this.interpreter.evaluateAst(args[2], state);
      } else {
        databaseValue = args[0];
        fieldValue = args[1];
        criteriaValue = args[2];
      }
      
      console.log('MYDSUM 평가된 매개변수:', { databaseValue, fieldValue, criteriaValue });
      
      // SimpleRangeValue 처리
      if (databaseValue && databaseValue.constructor?.name === 'SimpleRangeValue') {
        console.log('MYDSUM 데이터베이스에서 SimpleRangeValue 감지됨');
        databaseValue = this.extractDataFromSimpleRangeValue(databaseValue, state);
        console.log('MYDSUM 추출된 데이터베이스:', databaseValue);
      }
      
      if (criteriaValue && criteriaValue.constructor?.name === 'SimpleRangeValue') {
        console.log('MYDSUM 조건에서 SimpleRangeValue 감지됨');
        criteriaValue = this.extractDataFromSimpleRangeValue(criteriaValue, state);
        console.log('MYDSUM 추출된 조건:', criteriaValue);
      }
      
      if (!Array.isArray(databaseValue) || databaseValue.length === 0) {
        console.log('MYDSUM 데이터베이스가 유효하지 않음');
        return '#VALUE!';
      }
      
      // 헤더 행
      const headers = databaseValue[0];
      console.log('MYDSUM 헤더:', headers);
      
      // 필드 인덱스 찾기
      let fieldIndex = -1;
      if (typeof fieldValue === 'number') {
        fieldIndex = fieldValue - 1; // 1-based to 0-based
        console.log(`MYDSUM 필드 인덱스 (숫자): ${fieldIndex}`);
      } else {
        const fieldStr = String(fieldValue).toLowerCase();
        fieldIndex = headers.findIndex((h: any) => 
          String(h).toLowerCase() === fieldStr
        );
        console.log(`MYDSUM 필드 인덱스 (문자열 "${fieldStr}"): ${fieldIndex}`);
      }
      
      if (fieldIndex === -1 || fieldIndex >= headers.length) {
        console.log('MYDSUM 필드를 찾을 수 없음');
        return '#VALUE!';
      }
      
      // 조건 처리 (현재는 단순하게 - 추후 복잡한 조건 처리 가능)
      let sum = 0;
      let count = 0;
      
      // 조건이 있으면 처리, 없으면 전체 합계
      if (Array.isArray(criteriaValue) && criteriaValue.length > 1) {
        console.log('MYDSUM 조건부 합계 (현재는 전체 합계로 처리)');
        // TODO: 실제 조건 처리 로직 구현
      } else {
        console.log('MYDSUM 전체 합계');
      }
      
      // 데이터 행들 순회 (헤더 제외)
      for (let i = 1; i < databaseValue.length; i++) {
        const row = databaseValue[i];
        if (Array.isArray(row) && row.length > fieldIndex) {
          const value = row[fieldIndex];
          const numValue = parseFloat(value);
          
          console.log(`MYDSUM 행 ${i}, 필드값: ${value} -> 파싱: ${numValue}`);
          
          if (!isNaN(numValue)) {
            sum += numValue;
            count++;
          }
        }
      }
      
      console.log(`MYDSUM 결과: 합계=${sum}, 개수=${count}`);
      return sum;
    } catch (error) {
      console.error('MYDSUM 오류:', error);
      return '#ERROR!';
    }
  }
  private extractDataFromSimpleRangeValue(rangeValue: any, state: any): any {
    try {
      console.log('SimpleRangeValue 추출 시도');
      console.log('rangeValue.range:', rangeValue.range);
      console.log('rangeValue._data:', rangeValue._data);
      
      // 방법 1: range 정보를 이용해 DependencyGraph에서 직접 값 가져오기
      if (rangeValue.range && rangeValue.dependencyGraph) {
        console.log('방법 1: DependencyGraph 사용');
        const range = rangeValue.range;
        console.log('range 정보:', {
          start: range.start,
          end: range.end,
          width: range.width(),
          height: range.height()
        });
        
        const data: any[][] = [];
        
        for (let row = range.start.row; row <= range.end.row; row++) {
          const rowData: any[] = [];
          for (let col = range.start.col; col <= range.end.col; col++) {
            try {
              const address = { sheet: range.start.sheet, col, row };
              const cell = rangeValue.dependencyGraph.getCell(address);
              const value = cell ? cell.getCellValue() : '';
              console.log(`셀 [${row},${col}]: ${value}`);
              rowData.push(value);
            } catch (cellError) {
              console.log(`셀 [${row},${col}] 오류:`, cellError);
              rowData.push('');
            }
          }
          data.push(rowData);
        }
        
        console.log('추출된 데이터:', data);
        return data;
      }
      
      // 방법 2: 다른 속성들 시도
      if (rangeValue.getRawValue && typeof rangeValue.getRawValue === 'function') {
        console.log('방법 2: getRawValue 사용');
        const value = rangeValue.getRawValue();
        console.log('getRawValue 결과:', value);
        return value;
      }
      
      if (rangeValue.raw && typeof rangeValue.raw === 'function') {
        console.log('방법 3: raw 사용');
        const value = rangeValue.raw();
        console.log('raw 결과:', value);
        return value;
      }
      
      // 방법 3: 가능한 모든 속성 확인
      console.log('방법 4: 모든 속성 확인');
      const keys = Object.getOwnPropertyNames(rangeValue);
      console.log('SimpleRangeValue의 모든 속성:', keys);
      
      for (const key of keys) {
        if (key.includes('data') || key.includes('value')) {
          console.log(`속성 ${key}:`, rangeValue[key]);
        }
      }
      
      // 폴백: 빈 배열 반환
      console.log('데이터 추출 실패, 빈 배열 반환');
      return [[]];
      
    } catch (error) {
      console.error('SimpleRangeValue 추출 오류:', error);
      return [[]];
    }
  }
}

// 번역 객체
export const EnhancedFormulaPluginTranslations = {
  enGB: {
    HELLO2: 'HELLO2',
    MYTEXTJOIN: 'MYTEXTJOIN',
    MYUNIQUE: 'MYUNIQUE',
    MYSUM2: 'MYSUM2',
    MYDSUM: 'MYDSUM',
  },
  koKR: {
    HELLO2: 'HELLO2',
    MYTEXTJOIN: 'MYTEXTJOIN',
    MYUNIQUE: 'MYUNIQUE',
    MYSUM2: 'MYSUM2',
    MYDSUM: 'MYDSUM',
  }
};