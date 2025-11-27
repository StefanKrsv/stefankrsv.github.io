/**
 * SimpleJekyllSearch initialization for Turbo compatibility
 * This file should be loaded as a separate script after SimpleJekyllSearch library
 */

/* global SimpleJekyllSearch */

// Initialize SimpleJekyllSearch
function initializeSimpleJekyllSearch() {
  // Check if SimpleJekyllSearch is available
  if (typeof SimpleJekyllSearch === 'undefined') {
    console.warn('SimpleJekyllSearch library is not loaded');
    return;
  }

  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  if (!searchInput || !resultsContainer) {
    return;
  }

  // Clear previous results
  resultsContainer.innerHTML = '';

  // Get templates (now using script type="text/template")
  const templateElement = document.getElementById('search-result-template');
  const notFoundElement = document.getElementById('search-not-found-template');

  const resultTemplate = templateElement 
    ? templateElement.textContent.trim() 
    : '<article class="px-1 px-sm-2 px-lg-4 px-xl-0"><header><h2><a href="{url}">{title}</a></h2><div class="post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1">{categories}{tags}</div></header><p>{content}</p></article>';

  const notFoundText = notFoundElement 
    ? notFoundElement.textContent.trim() 
    : '<p class="mt-5">No results found</p>';

  // Get search JSON path
  const searchJsonElement = document.querySelector('[data-search-json]');
  const searchJsonPath = searchJsonElement 
    ? searchJsonElement.dataset.searchJson 
    : '/assets/js/data/search.json';

  // Initialize SimpleJekyllSearch
  try {
    SimpleJekyllSearch({
      searchInput: searchInput,
      resultsContainer: resultsContainer,
      json: searchJsonPath,
      searchResultTemplate: resultTemplate,
      noResultsText: notFoundText,
      templateMiddleware: function(prop, value) {
        if (prop === 'categories') {
          if (value === '') {
            return value;
          }
          return `<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>${value}</div>`;
        }
        if (prop === 'tags') {
          if (value === '') {
            return value;
          }
          return `<div><i class="fa fa-tag fa-fw"></i>${value}</div>`;
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize SimpleJekyllSearch:', error);
  }
}

// Export for module usage
export { initializeSimpleJekyllSearch };

// Initialize on Turbo events
document.addEventListener('turbo:load', initializeSimpleJekyllSearch);
document.addEventListener('turbo:render', initializeSimpleJekyllSearch);

// Initialize immediately if document is already loaded (fallback for non-Turbo)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSimpleJekyllSearch);
} else {
  initializeSimpleJekyllSearch();
}
