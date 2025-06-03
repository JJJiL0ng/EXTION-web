/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface Timeout {
      readonly [Symbol.toPrimitive]: (hint: 'default') => string;
    }
  }
}

export {}; 