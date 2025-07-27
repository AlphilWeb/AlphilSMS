// components/ui/pagination.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
};

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';

  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <PageLink 
          key={1} 
          page={1} 
          currentPage={currentPage} 
          url={getPageUrl(1)}
        />
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-3 py-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PageLink 
          key={i} 
          page={i} 
          currentPage={currentPage} 
          url={getPageUrl(i)}
        />
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-3 py-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <PageLink 
          key={totalPages} 
          page={totalPages} 
          currentPage={currentPage} 
          url={getPageUrl(totalPages)}
        />
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <Link
          href={getPageUrl(Math.max(1, currentPage - 1))}
          className={`relative inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          aria-disabled={currentPage === 1}
        >
          Previous
        </Link>
        <Link
          href={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          aria-disabled={currentPage === totalPages}
        >
          Next
        </Link>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <Link
              href={getPageUrl(Math.max(1, currentPage - 1))}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-disabled={currentPage === 1}
            >
              <span className="sr-only">Previous</span>
              <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            
            {renderPageNumbers()}
            
            <Link
              href={getPageUrl(Math.min(totalPages, currentPage + 1))}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <FiChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

type PageLinkProps = {
  page: number;
  currentPage: number;
  url: string;
};

function PageLink({ page, currentPage, url }: PageLinkProps) {
  return (
    <Link
      href={url}
      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage 
        ? 'z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600' 
        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
      }`}
    >
      {page}
    </Link>
  );
}