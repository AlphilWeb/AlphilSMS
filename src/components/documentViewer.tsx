'use client';

import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { FiX } from 'react-icons/fi';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] max-w-[95vw]">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {document.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="h-[80vh]">
            {document.type === 'pdf' ? (
              <Worker workerUrl={workerUrl}>
                <Viewer
                  fileUrl={getDocumentUrl()}
                  defaultScale={SpecialZoomLevel.PageWidth}
                />
              </Worker>
            ) : (
              <div className="prose prose-sm max-w-none h-full overflow-auto">
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