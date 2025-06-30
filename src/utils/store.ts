import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DevtoolsOptions {
  name: string;
  enabled?: boolean;
  trace?: boolean;
  serialize?: boolean;
}

export const createStore = <T>(
  storeConfig: any, 
  options: DevtoolsOptions
) => {
  const devtoolsConfig = {
    name: options.name,
    enabled: options.enabled ?? process.env.NODE_ENV === 'development',
    trace: options.trace ?? true,
    serialize: options.serialize !== false,
  };

  if (devtoolsConfig.enabled) {
    return create<T>()(devtools(storeConfig, devtoolsConfig));
  }
  
  return create<T>()(storeConfig);
}

// 액션 로깅을 위한 헬퍼 함수
export const logAction = (actionName: string, payload?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 [Zustand Action] ${actionName}`, payload);
  }
}

// 상태 변경 로깅을 위한 헬퍼 함수
export const createActionLogger = (storeName: string) => {
  return (actionName: string, payload?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [${storeName}] ${actionName}`, payload);
    }
  };
};