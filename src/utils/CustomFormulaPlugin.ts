// src/utils/CustomFormulaPlugin.ts
import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

export class CustomFormulaPlugin extends FunctionPlugin {
  static implementedFunctions = {
    // 1. SORT - Excel과 동일한 함수명
    SORT: {
      method: 'sortCustom',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }, // 정렬할 범위
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 }, // 정렬 기준 열
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true } // 오름차순 여부
      ],
    },

    // 2. TEXTJOIN - Excel과 동일한 함수명
    TEXTJOIN: {
      method: 'textJoinCustom',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }, // 구분자
        { argumentType: FunctionArgumentType.BOOLEAN }, // 빈 값 무시
        { argumentType: FunctionArgumentType.RANGE } // 텍스트 범위
      ],
    },

    // 3. FILTER - Excel과 동일한 함수명
    FILTER: {
      method: 'filterCustom',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }, // 데이터 범위
        { argumentType: FunctionArgumentType.RANGE } // 조건 범위
      ],
    },

    // 4. XLOOKUP - Excel과 동일한 함수명
    XLOOKUP: {
      method: 'xlookupCustom',
      parameters: [
        { argumentType: FunctionArgumentType.SCALAR }, // 찾을 값
        { argumentType: FunctionArgumentType.RANGE }, // 찾을 범위
        { argumentType: FunctionArgumentType.RANGE }, // 반환 범위
        { argumentType: FunctionArgumentType.SCALAR, defaultValue: "#N/A" } // 기본값
      ],
    },

    // 5. UNIQUE - Excel과 동일한 함수명
    UNIQUE: {
      method: 'uniqueCustom',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE }, // 중복 제거할 범위
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false } // 열 기준 여부
      ],
    },

    // 6. WORKDAYS_KR - 한국 특화 함수만 접미사 유지
    WORKDAYS_KR: {
      method: 'workdaysKr',
      parameters: [
        { argumentType: FunctionArgumentType.SCALAR }, // 시작일
        { argumentType: FunctionArgumentType.SCALAR }, // 종료일
      ],
    }
  };

  // SORT 구현
  sortCustom(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('SORT'),
      (range: any, sortColumn: number = 1, ascending: boolean = true): any => {
        try {
          // 범위를 2D 배열로 변환
          const data = this.rangeToArray(range);
          if (!data || data.length === 0) return [];

          // 정렬 수행
          const sortedData = [...data].sort((a, b) => {
            const aVal = a[sortColumn - 1];
            const bVal = b[sortColumn - 1];
            
            // 숫자 비교
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return ascending ? aNum - bNum : bNum - aNum;
            }
            
            // 문자열 비교
            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            
            if (ascending) {
              return aStr.localeCompare(bStr);
            } else {
              return bStr.localeCompare(aStr);
            }
          });

          return sortedData;
        } catch (error) {
          console.error('SORT error:', error);
          return [];
        }
      }
    );
  }

  // TEXTJOIN 구현
  textJoinCustom(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('TEXTJOIN'),
      (delimiter: string, ignoreEmpty: boolean, range: any): any => {
        try {
          const data = this.rangeToArray(range);
          if (!data) return '';

          const values = data.flat().map(val => String(val || ''));
          const filteredValues = ignoreEmpty 
            ? values.filter(val => val.trim() !== '')
            : values;

          return filteredValues.join(delimiter);
        } catch (error) {
          console.error('TEXTJOIN error:', error);
          return '';
        }
      }
    );
  }

  // FILTER 구현
  filterCustom(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('FILTER'),
      (dataRange: any, conditionRange: any): any => {
        try {
          const data = this.rangeToArray(dataRange);
          const conditions = this.rangeToArray(conditionRange);
          
          if (!data || !conditions) return [];

          const conditionValues = conditions.flat();
          
          return data.filter((row, index) => {
            const condition = conditionValues[index];
            return condition === true || condition === 1 || 
                   condition === 'TRUE' || condition === 'true';
          });
        } catch (error) {
          console.error('FILTER error:', error);
          return [];
        }
      }
    );
  }

  // XLOOKUP 구현
  xlookupCustom(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('XLOOKUP'),
      (lookupValue: any, lookupArray: any, returnArray: any, ifNotFound: any = "#N/A"): any => {
        try {
          const lookupData = this.rangeToArray(lookupArray).flat();
          const returnData = this.rangeToArray(returnArray).flat();
          
          const index = lookupData.findIndex(val => 
            String(val || '').toLowerCase() === String(lookupValue || '').toLowerCase()
          );
          
          if (index >= 0 && index < returnData.length) {
            return returnData[index];
          }
          
          return ifNotFound;
        } catch (error) {
          console.error('XLOOKUP error:', error);
          return ifNotFound;
        }
      }
    );
  }

  // UNIQUE 구현
  uniqueCustom(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('UNIQUE'),
      (range: any, byColumn: boolean = false): any => {
        try {
          const data = this.rangeToArray(range);
          if (!data || data.length === 0) return [];

          if (byColumn) {
            // 열 기준 중복 제거 (행 전체 비교)
            const unique = [];
            const seen = new Set();
            
            for (const row of data) {
              const key = JSON.stringify(row);
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(row);
              }
            }
            
            return unique;
          } else {
            // 단순 값 중복 제거
            const flatData = data.flat();
            const uniqueValues = Array.from(new Set(flatData));
            return uniqueValues.map(val => [val]); // 단일 열로 반환
          }
        } catch (error) {
          console.error('UNIQUE error:', error);
          return [];
        }
      }
    );
  }

  // WORKDAYS_KR 구현
  workdaysKr(ast: any, state: any): any {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('WORKDAYS_KR'),
      (startDate: any, endDate: any): any => {
        try {
          // 한국 공휴일 (2024년 기준)
          const koreanHolidays = [
            '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
            '2024-03-01', '2024-05-05', '2024-05-15', '2024-06-06', '2024-08-15',
            '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03', '2024-10-09', '2024-12-25'
          ];
          
          let current = new Date(startDate);
          const end = new Date(endDate);
          let workdays = 0;
          
          while (current <= end) {
            const dayOfWeek = current.getDay();
            const dateStr = current.toISOString().split('T')[0];
            
            // 주말이 아니고 공휴일이 아닌 경우
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !koreanHolidays.includes(dateStr)) {
              workdays++;
            }
            
            current.setDate(current.getDate() + 1);
          }
          
          return workdays;
        } catch (error) {
          console.error('WORKDAYS_KR error:', error);
          return 0;
        }
      }
    );
  }

  // 유틸리티: 범위를 배열로 변환
  private rangeToArray(range: any): any[][] {
    if (Array.isArray(range)) {
      return range;
    }
    
    // HyperFormula 범위 객체 처리
    if (range && typeof range === 'object' && range.height && range.width) {
      const result = [];
      for (let row = 0; row < range.height; row++) {
        const rowData = [];
        for (let col = 0; col < range.width; col++) {
          rowData.push(range.data[row * range.width + col] || '');
        }
        result.push(rowData);
      }
      return result;
    }
    
    return [];
  }
}

// 번역 설정
export const CustomFormulaPluginTranslations = {
  enGB: {
    SORT: 'SORT',
    TEXTJOIN: 'TEXTJOIN',
    FILTER: 'FILTER',
    XLOOKUP: 'XLOOKUP',
    UNIQUE: 'UNIQUE',
    WORKDAYS_KR: 'WORKDAYS_KR',
  },
  koKR: {
    SORT: '정렬',
    TEXTJOIN: '텍스트결합',
    FILTER: '필터',
    XLOOKUP: '조회',
    UNIQUE: '고유값',
    WORKDAYS_KR: '한국근무일',
  }
};