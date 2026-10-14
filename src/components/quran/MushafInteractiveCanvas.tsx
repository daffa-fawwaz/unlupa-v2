import React, { useState, useEffect } from 'react';
import { PageIssue, Language } from '../../types';
import { PageAyahInfo, getPageAyahsMetadata, fetchPageAyahsWithText } from './quranPageAyahs';
import { MushafDrawingCanvas } from './MushafDrawingCanvas';

interface MushafInteractiveCanvasProps {
  pageNumber: number;
  imageUrl: string;
  isRightPage: boolean;
  issues: PageIssue[];
  onSelectAyah?: (ayah: PageAyahInfo) => void;
  language: Language;
  onImageLoad?: () => void;
}

export const MushafInteractiveCanvas: React.FC<MushafInteractiveCanvasProps> = ({
  pageNumber,
  imageUrl,
  isRightPage,
  issues,
  language,
  onImageLoad
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden select-none flex items-center justify-center group/canvas">
      <img
        src={imageUrl}
        alt={`Halaman ${pageNumber}`}
        onLoad={onImageLoad}
        className="w-full h-full object-fill select-none transition-all duration-200 pointer-events-none"
      />

      {/* Spine Edge Gradation */}
      <div 
        className={`absolute inset-y-0 pointer-events-none z-10 ${
          isRightPage 
            ? 'left-0 w-4 bg-gradient-to-r from-black/25 via-black/8 to-transparent' 
            : 'right-0 w-4 bg-gradient-to-l from-black/25 via-black/8 to-transparent'
        }`} 
      />

      {/* Freehand Pencil Drawing & Digital Markup Overlay (Zero Lag, Persistent per Page) */}
      <MushafDrawingCanvas 
        pageNumber={pageNumber}
        isRightPage={isRightPage}
        language={language}
      />
    </div>
  );
};
