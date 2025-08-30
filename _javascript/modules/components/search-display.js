/**
 * Enhanced search script for Turbo Hotwire compatibility
 * Handles Turbo navigation events and proper cleanup
 */

// CSS class names
const LOADED = 'd-block';
const UNLOADED = 'd-none';
const FOCUS = 'input-focus';
const FLEX = 'd-flex';

/* Actions in mobile screens (Sidebar hidden) */
class MobileSearchBar {
  static on() {
    const btnSbTrigger = document.getElementById('sidebar-trigger');
    const topbarTitle = document.getElementById('topbar-title');
    const btnSearchTrigger = document.getElementById('search-trigger');
    const search = document.getElementById('search');
    const btnCancel = document.getElementById('search-cancel');

    if (btnSbTrigger) btnSbTrigger.classList.add(UNLOADED);
    if (topbarTitle) topbarTitle.classList.add(UNLOADED);
    if (btnSearchTrigger) btnSearchTrigger.classList.add(UNLOADED);
    if (search) search.classList.add(FLEX);
    if (btnCancel) btnCancel.classList.add(LOADED);
  }

  static off() {
    const btnSbTrigger = document.getElementById('sidebar-trigger');
    const topbarTitle = document.getElementById('topbar-title');
    const btnSearchTrigger = document.getElementById('search-trigger');
    const search = document.getElementById('search');
    const btnCancel = document.getElementById('search-cancel');

    if (btnCancel) btnCancel.classList.remove(LOADED);
    if (search) search.classList.remove(FLEX);
    if (btnSbTrigger) btnSbTrigger.classList.remove(UNLOADED);
    if (topbarTitle) topbarTitle.classList.remove(UNLOADED);
    if (btnSearchTrigger) btnSearchTrigger.classList.remove(UNLOADED);
  }
}

class ResultSwitch {
  static resultVisible = false;

  static on() {
    if (!this.resultVisible) {
      const resultWrapper = document.getElementById('search-result-wrapper');
      const content = document.querySelectorAll(
        '#main-wrapper>.container>.row'
      );

      if (resultWrapper) resultWrapper.classList.remove(UNLOADED);
      content.forEach((el) => {
        el.classList.add(UNLOADED);
      });
      this.resultVisible = true;
    }
  }

  static off() {
    if (this.resultVisible) {
      const resultWrapper = document.getElementById('search-result-wrapper');
      const results = document.getElementById('search-results');
      const hints = document.getElementById('search-hints');
      const content = document.querySelectorAll(
        '#main-wrapper>.container>.row'
      );
      const input = document.getElementById('search-input');

      if (results) results.innerHTML = '';
      if (hints && hints.classList.contains(UNLOADED)) {
        hints.classList.remove(UNLOADED);
      }
      if (resultWrapper) resultWrapper.classList.add(UNLOADED);
      content.forEach((el) => {
        el.classList.remove(UNLOADED);
      });
      if (input) input.value = ''; // Fixed: use 'value' instead of 'textContent'
      this.resultVisible = false;
    }
  }

  static reset() {
    this.resultVisible = false;
  }
}

function isMobileView() {
  const btnCancel = document.getElementById('search-cancel');
  return btnCancel && btnCancel.classList.contains(LOADED);
}

// Store event listeners for cleanup
let searchEventListeners = [];

function addEventListenerWithCleanup(element, event, handler) {
  if (element) {
    element.addEventListener(event, handler);
    searchEventListeners.push({ element, event, handler });
  }
}

function cleanupEventListeners() {
  searchEventListeners.forEach(({ element, event, handler }) => {
    if (element) {
      element.removeEventListener(event, handler);
    }
  });
  searchEventListeners = [];
}

function setupSearchListeners() {
  const btnSearchTrigger = document.getElementById('search-trigger');
  const btnCancel = document.getElementById('search-cancel');
  const input = document.getElementById('search-input');
  const search = document.getElementById('search');
  const hints = document.getElementById('search-hints');

  // Search trigger click handler
  const handleSearchTrigger = () => {
    MobileSearchBar.on();
    ResultSwitch.on();
    if (input) input.focus();
  };

  // Cancel button click handler
  const handleCancel = () => {
    MobileSearchBar.off();
    ResultSwitch.off();
  };

  // Input focus handler
  const handleFocus = () => {
    if (search) search.classList.add(FOCUS);
  };

  // Input focus out handler
  const handleFocusOut = () => {
    if (search) search.classList.remove(FOCUS);
  };

  // Input change handler
  const handleInput = () => {
    if (!input) return;

    if (input.value === '') {
      if (isMobileView()) {
        if (hints) hints.classList.remove(UNLOADED);
      } else {
        ResultSwitch.off();
      }
    } else {
      ResultSwitch.on();
      if (isMobileView() && hints) {
        hints.classList.add(UNLOADED);
      }
    }
  };

  // Add all event listeners with cleanup tracking
  addEventListenerWithCleanup(btnSearchTrigger, 'click', handleSearchTrigger);
  addEventListenerWithCleanup(btnCancel, 'click', handleCancel);
  addEventListenerWithCleanup(input, 'focus', handleFocus);
  addEventListenerWithCleanup(input, 'focusout', handleFocusOut);
  addEventListenerWithCleanup(input, 'input', handleInput);
}

// Main initialization function
export function displaySearch() {
  // Clean up any existing listeners
  cleanupEventListeners();

  // Reset state
  ResultSwitch.reset();

  // Setup new listeners
  setupSearchListeners();
}

// Turbo event handlers
function handleTurboLoad() {
  displaySearch();
}

function handleTurboBeforeVisit() {
  // Clean up before navigating away
  cleanupEventListeners();
  ResultSwitch.off();
  MobileSearchBar.off();
}

function handleTurboRender() {
  // Re-initialize after Turbo renders new content
  displaySearch();
}

// Initialize on DOM content loaded (for initial page load)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displaySearch);
} else {
  displaySearch();
}

// Turbo-specific event listeners
document.addEventListener('turbo:load', handleTurboLoad);
document.addEventListener('turbo:before-visit', handleTurboBeforeVisit);
document.addEventListener('turbo:render', handleTurboRender);

// Optional: Handle Turbo form submissions that might affect search
document.addEventListener('turbo:before-stream-render', () => {
  // Clean up search state before Turbo streams update the page
  ResultSwitch.off();
  MobileSearchBar.off();
});

// Handle page cache restoration
document.addEventListener('turbo:before-cache', () => {
  // Reset search state before page is cached
  ResultSwitch.off();
  MobileSearchBar.off();
  const input = document.getElementById('search-input');
  if (input) input.value = '';
});
