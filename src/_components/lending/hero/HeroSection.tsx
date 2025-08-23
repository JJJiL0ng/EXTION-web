'use client';

import React from 'react';

const HeroSection = () => {
    return (
        <section className="min-h-screen bg-gray-50 py-20 relative overflow-hidden flex items-center justify-center">
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
                    what you want for Excel
                </h2>
                <p className="text-xl md:text-2xl text-gray-900 font-light mb-6">
                    The Excel AI loved by professionals.
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
