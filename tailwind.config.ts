
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/_components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/_aaa_sheetChat/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'text-gray-300',
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-50',
    'text-gray-100',
    'border-gray-300',
    'border-gray-400',
    'border-gray-500',
    'border-gray-600',
    'border-gray-700',
    'left-[70%]',
    'border-[#D9D9D9]',
    'space-x-3',
    'text-6xl',
    'border-5',
    'max-w-6xl',
    'px-1',
    'pl-2',
    'gap-3',
    'w-56',
    'bg-gray-200',
    'px-10',
    'opacity-40', 
    'bg-[#F0F2F5]',
    'bg-[#005de9]'
    

  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
      },
      animation: {
        'grid-scan-horizontal': 'grid-scan-horizontal 3s infinite linear',
        'grid-scan-vertical': 'grid-scan-vertical 4s infinite linear',
        'line-wave': 'line-wave 2s infinite ease-in-out',
      },
      keyframes: {
        'grid-scan-horizontal': {
          '0%': { 
            backgroundPosition: '-200px 0',
          },
          '100%': { 
            backgroundPosition: 'calc(100% + 200px) 0',
          },
        },
        'grid-scan-vertical': {
          '0%': { 
            backgroundPosition: '0 -200px',
          },
          '100%': { 
            backgroundPosition: '0 calc(100% + 200px)',
          },
        },
        'line-wave': {
          '0%, 100%': { 
            opacity: '0.3',
          },
          '50%': { 
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        '.excel-grid-base': {
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        },
        '.excel-grid-scan-h': {
          position: 'relative',
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundImage: `
              linear-gradient(90deg, 
                transparent 0%, 
                transparent 40%, 
                rgba(59, 130, 246, 0.8) 45%, 
                rgba(59, 130, 246, 1) 50%, 
                rgba(59, 130, 246, 0.8) 55%, 
                transparent 60%, 
                transparent 100%
              ),
              linear-gradient(to right, rgba(59, 130, 246, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '200px 100%, 20px 20px, 20px 20px',
            animation: 'grid-scan-horizontal 3s infinite linear',
            pointerEvents: 'none',
          },
        },
        '.excel-grid-scan-v': {
          position: 'relative',
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundImage: `
              linear-gradient(0deg, 
                transparent 0%, 
                transparent 40%, 
                rgba(59, 130, 246, 0.8) 45%, 
                rgba(59, 130, 246, 1) 50%, 
                rgba(59, 130, 246, 0.8) 55%, 
                transparent 60%, 
                transparent 100%
              ),
              linear-gradient(to right, rgba(59, 130, 246, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '100% 200px, 20px 20px, 20px 20px',
            animation: 'grid-scan-vertical 4s infinite linear',
            pointerEvents: 'none',
          },
        },
      });
    },
  ],
};
export default config;
