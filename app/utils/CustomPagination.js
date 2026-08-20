'use client'
import React from 'react'

// eslint-disable-next-line react/prop-types
export default function CustomPagination({ totalPage, currentPage, setCurrentPage }) {
    const pages = [];

    if (totalPage <= 5) {
        for (let i = 1; i <= totalPage; i++) {
            pages.push(i);
        }
    } else {
        if (currentPage < 3) {
            pages.push(1, 2, 3, "...", totalPage);
        } else if (currentPage >= totalPage - 2) {
            pages.push(1, "...", totalPage - 2, totalPage - 1, totalPage);
        } else {
            pages.push(1, "...", currentPage, currentPage + 1, currentPage + 2,'...',totalPage);
        }
    }

    const handlePageChange = (page) => {
        if (typeof page === 'number' && page !== currentPage) {
            setCurrentPage(page)
        }
    }


    return (
        <nav role="navigation" aria-label="pagination" className="mx-auto flex w-full justify-center mt-4">
            <ul className="flex flex-row items-center gap-1">
                <li>
                    <button 
                        onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        disabled={currentPage <= 1}
                        className={`flex items-center justify-center px-3 py-2 text-sm rounded-md border ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    >
                        Previous
                    </button>
                </li>
                {
                    pages &&
                    pages.map((item,idx) =>
                        item === "..." ?
                            (<li key={idx} className="flex items-center justify-center px-3 py-2 text-sm">
                                ...
                            </li>)
                            :
                            (
                                <li key={idx}>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handlePageChange(item)
                                        }}
                                        className={`flex items-center justify-center w-9 h-9 text-sm rounded-md border ${item === currentPage ? 'border-blue-500 bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                    >
                                        {item}
                                    </button>
                                </li>
                            )
                    )
                }
                <li>
                    <button 
                        disabled={currentPage === totalPage}
                        onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPage) setCurrentPage(currentPage + 1)
                        }}
                        className={`flex items-center justify-center px-3 py-2 text-sm rounded-md border ${currentPage === totalPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    )
}
