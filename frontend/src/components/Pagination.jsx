function getPageNumbers(currentPage, totalPages, maxVisiblePages) {
  const minSlots = 3; 
  const visibleCount = Math.max(maxVisiblePages, minSlots);

  if (totalPages <= visibleCount) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const siblingCount = Math.max(1, Math.floor((visibleCount - 3) / 2));

  let start = Math.max(2, currentPage - siblingCount);
  let end = Math.min(totalPages - 1, currentPage + siblingCount);

  
  const windowSize = end - start + 1;
  const desiredWindow = visibleCount - 2; 

  if (windowSize < desiredWindow) {
    if (start === 2) {
      end = Math.min(totalPages - 1, end + (desiredWindow - windowSize));
    } else if (end === totalPages - 1) {
      start = Math.max(2, start - (desiredWindow - windowSize));
    }
  }

  pages.push(1);

  if (start > 2) {
    pages.push("...");
  }

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("...");
  }

  pages.push(totalPages);

  return pages;
}

function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 5,
  disabled = false,
}) {
  const safeTotalPages = Math.max(1, totalPages);

  if (safeTotalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    safeTotalPages
  );

  const isPrevDisabled = disabled || safeCurrentPage <= 1;
  const isNextDisabled = disabled || safeCurrentPage >= safeTotalPages;

  const goToPage = (page) => {
    if (disabled) return;
    if (page < 1 || page > safeTotalPages) return;
    if (page === safeCurrentPage) return;
    if (typeof onPageChange === "function") {
      onPageChange(page);
    }
  };

  const pageItems = getPageNumbers(
    safeCurrentPage,
    safeTotalPages,
    maxVisiblePages
  );

  return (
    <nav aria-label="Pagination">
      <ul className="pagination mb-0">
        <li className={`page-item ${isPrevDisabled ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={isPrevDisabled}
          >
            Previous
          </button>
        </li>

        {pageItems.map((item, index) =>
          item === "..." ? (
            <li key={`ellipsis-${index}`} className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li
              key={item}
              className={`page-item ${
                item === safeCurrentPage ? "active" : ""
              }`}
            >
              <button
                type="button"
                className="page-link"
                onClick={() => goToPage(item)}
                disabled={disabled}
              >
                {item}
              </button>
            </li>
          )
        )}

        <li className={`page-item ${isNextDisabled ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={isNextDisabled}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;