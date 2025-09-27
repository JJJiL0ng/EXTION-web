// hooks/useResizableLayout.ts
import { useState, useCallback, useRef, useEffect } from 'react';

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

    const startResize = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResize = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // 경계값 체크
        const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
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