'use client';

import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface DocumentViewerProps {
  document: {
    url: string;
    type: string;
    title: string;
    content?: string;
  };
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  // Get the correct worker URL based on your package version
  const workerUrl = `https://unpkg.com/pdfjs-dist@${process.env.NEXT_PUBLIC_PDFJS_VERSION || '3.11.174'}/build/pdf.worker.min.js`;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getDocumentUrl = () => {
    if (document.url.startsWith('http')) {
      return document.url;
    }
    if (document.url.startsWith('/')) {
      return `${window.location.origin}${document.url}`;
    }
    return `${window.location.origin}/${document.url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="fixed inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[95vw] sm:w-auto flex flex-col">
        <div className="flex justify-between items-center border-b p-4 sm:p-6 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[70%]">
            {document.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="flex-1 min-h-0 p-2 sm:p-4 md:p-6">
          <div className="h-full overflow-auto">
            {document.type === 'pdf' ? (
              <Worker workerUrl={workerUrl}>
                <Viewer
                  fileUrl={getDocumentUrl()}
                  defaultScale={isMobile ? SpecialZoomLevel.PageFit : SpecialZoomLevel.PageWidth}
                  theme={{
                    theme: 'auto'
                  }}
                />
              </Worker>
            ) : (
              <div className="prose prose-sm max-w-none h-full overflow-auto p-2 sm:p-4">
                {document.content && (
                  <div dangerouslySetInnerHTML={{ __html: document.content }} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}