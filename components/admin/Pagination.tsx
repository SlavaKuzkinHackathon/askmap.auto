// components/admin/Pagination.tsx
"use client";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const buttonBaseClasses = "px-4 py-2 text-sm font-medium border rounded-md transition-colors";
  const activeClasses = "bg-emerald-600 text-white border-emerald-600";
  const inactiveClasses = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
  const disabledClasses = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${buttonBaseClasses} ${page === 1 ? disabledClasses : inactiveClasses}`}
      >
        Назад
      </button>
      <div className="flex items-center gap-2">
        {pageNumbers.map((p, index) => 
          typeof p === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(p)}
              className={`${buttonBaseClasses} ${p === page ? activeClasses : inactiveClasses}`}
            >
              {p}
            </button>
          ) : (
            <span key={index} className="px-4 py-2 text-sm text-gray-500">...</span>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`${buttonBaseClasses} ${page === totalPages ? disabledClasses : inactiveClasses}`}
      >
        Вперед
      </button>
    </div>
  );
}