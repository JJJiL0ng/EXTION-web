// hooks/useResizableLayout.ts
import { useState, useCallback, useRef, useEffect } from 'react';

// throttle 함수 - 성능 최적화를 위해
const throttle = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return function (...args: any[]) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func(...args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
};

interface UseResizerProps {
    initialLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
}

export const useResizer = ({
    initialLeftWidth = 70,
    minLeftWidth = 20,
    maxLeftWidth = 80
}: UseResizerProps = {}) => {

    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const cachedRectRef = useRef<DOMRect | null>(null);

    const startResize = useCallback(() => {
        // 리사이징 시작 시 컨테이너 크기를 한 번만 계산하여 캐시
        if (containerRef.current) {
            cachedRectRef.current = containerRef.current.getBoundingClientRect();
        }
        setIsResizing(true);
    }, []);

    const stopResize = useCallback(() => {
        setIsResizing(false);
        cachedRectRef.current = null; // 캐시 정리
    }, []);

    // 실시간 시각적 업데이트를 위한 즉시 resize 함수
    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing || !cachedRectRef.current) return;

        // 캐시된 rect 사용으로 DOM 쿼리 제거
        const containerRect = cachedRectRef.current;
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // 경계값 체크
        const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);

        // 즉시 상태 업데이트 - 시각적 끊김 방지
        setLeftWidth(clampedWidth);
    }, [isResizing, minLeftWidth, maxLeftWidth]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resize, stopResize]);

    return {
        leftWidth,
        rightWidth: 100 - leftWidth,
        isResizing,
        containerRef,
        startResize
    };
};