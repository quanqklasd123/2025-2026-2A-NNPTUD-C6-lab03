// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let currentSort = { field: null, order: null };

// ==================== GET ALL PRODUCTS ====================
async function getAllProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
        return [];
    }
}

// ==================== INITIALIZE ====================
async function init() {
    allProducts = await getAllProducts();
    filteredProducts = [...allProducts];
    renderProducts();
}

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    const tableBody = document.getElementById('productTableBody');
    const resultsCount = document.getElementById('resultsCount');
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Update results count
    resultsCount.textContent = `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} trong tổng số ${filteredProducts.length} sản phẩm`;
    
    // Check if no products
    if (paginatedProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-results">Không tìm thấy sản phẩm nào!</td>
            </tr>
        `;
        renderPagination();
        return;
    }
    
    // Render table rows
    tableBody.innerHTML = paginatedProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${getProductImage(product)}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
            </td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${truncateText(product.description, 100)}</td>
            <td>${product.category ? product.category.name : 'N/A'}</td>
        </tr>
    `).join('');
    
    renderPagination();
}

// ==================== GET PRODUCT IMAGE ====================
function getProductImage(product) {
    if (product.images && product.images.length > 0) {
        // Clean the image URL (remove brackets and quotes if present)
        let imageUrl = product.images[0];
        if (typeof imageUrl === 'string') {
            imageUrl = imageUrl.replace(/[\[\]"']/g, '');
        }
        return imageUrl;
    }
    return 'https://via.placeholder.com/100x100?text=No+Image';
}

// ==================== TRUNCATE TEXT ====================
function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ==================== SEARCH ====================
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply current sort if exists
    if (currentSort.field) {
        applySorting(currentSort.field, currentSort.order);
    }
    
    // Reset to first page when searching
    currentPage = 1;
    renderProducts();
}

// ==================== PAGE SIZE CHANGE ====================
function handlePageSizeChange() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1; // Reset to first page
    renderProducts();
}

// ==================== SORTING ====================
function sortProducts(field, order) {
    currentSort = { field, order };
    
    // Update active button state
    updateSortButtonState(field, order);
    
    applySorting(field, order);
    currentPage = 1; // Reset to first page
    renderProducts();
}

function applySorting(field, order) {
    filteredProducts.sort((a, b) => {
        let valueA, valueB;
        
        if (field === 'price') {
            valueA = a.price;
            valueB = b.price;
        } else if (field === 'title') {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        }
        
        if (order === 'asc') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
}

function updateSortButtonState(field, order) {
    // Remove active class from all buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current button
    const buttonClass = `${field === 'price' ? 'price' : 'name'}-${order}`;
    const activeButton = document.querySelector(`.sort-btn.${buttonClass}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ==================== PAGINATION ====================
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Trước
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
    }
    
    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
        paginationHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Sau →
        </button>
    `;
    
    // Page info
    paginationHTML += `<span class="page-info">Trang ${currentPage}/${totalPages}</span>`;
    
    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    
    // Scroll to top of table
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
