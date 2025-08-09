'use client';

import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
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
  const toolbarPluginInstance = toolbarPlugin();

  // Get the correct worker URL based on your package version
  // For @react-pdf-viewer/core@3.11.174, use pdf.js 3.11.174 worker
  const workerUrl = `https://unpkg.com/pdfjs-dist@${process.env.NEXT_PUBLIC_PDFJS_VERSION || '3.11.174'}/build/pdf.worker.min.js`;

  // Fix URL handling
  const getDocumentUrl = () => {
    // If it's already a full URL, return as is
    if (document.url.startsWith('http')) {
      return document.url;
    }
    
    // If it's a relative path starting with /, construct full URL
    if (document.url.startsWith('/')) {
      return `${window.location.origin}${document.url}`;
    }
    
    // If it's a relative path without /, add it
    return `${window.location.origin}/${document.url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
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
          <div className="h-[70vh]">
            {document.type === 'pdf' ? (
              <Worker workerUrl={workerUrl}>
                <Viewer
                  fileUrl={getDocumentUrl()}
                  plugins={[toolbarPluginInstance]}
                  defaultScale={SpecialZoomLevel.ActualSize}
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