const ATTR_DISPLAY = 'sidebar-display';

class SidebarUtil {
  static #isExpanded = false;

  static toggle() {
    this.#isExpanded = !this.#isExpanded;
    document.body.toggleAttribute(ATTR_DISPLAY, this.#isExpanded);

    const $sidebar = document.getElementById('sidebar');
    const $mask = document.getElementById('mask');

    if ($sidebar) {
      $sidebar.classList.toggle('z-2', this.#isExpanded);
    }
    if ($mask) {
      $mask.classList.toggle('d-none', !this.#isExpanded);
    }
  }

  static close() {
    this.#isExpanded = false;
    document.body.removeAttribute(ATTR_DISPLAY);

    const $sidebar = document.getElementById('sidebar');
    const $mask = document.getElementById('mask');

    if ($sidebar) {
      $sidebar.classList.remove('z-2');
    }
    if ($mask) {
      $mask.classList.add('d-none');
    }
  }

  static init() {
    // Remove any existing listeners to prevent duplicates
    this.cleanup();

    const $trigger = document.getElementById('sidebar-trigger');
    const $mask = document.getElementById('mask');

    if ($trigger) {
      $trigger.addEventListener('click', this.toggle.bind(this));
    }
    if ($mask) {
      $mask.addEventListener('click', this.toggle.bind(this));
    }
  }

  static cleanup() {
    const $trigger = document.getElementById('sidebar-trigger');
    const $mask = document.getElementById('mask');

    if ($trigger) {
      $trigger.removeEventListener('click', this.toggle.bind(this));
    }
    if ($mask) {
      $mask.removeEventListener('click', this.toggle.bind(this));
    }
  }
}

// Initialize on DOM load and Turbo navigation
export function initSidebar() {
  SidebarUtil.init();
}

// Turbo event listeners
document.addEventListener('DOMContentLoaded', initSidebar);
document.addEventListener('turbo:load', initSidebar);

// Clean up on page unload to prevent memory leaks
document.addEventListener('turbo:before-cache', () => {
  SidebarUtil.cleanup();
  SidebarUtil.close(); // Close sidebar before caching the page
});

// Alternative: Use Turbo's data-turbo-permanent to persist sidebar state
// Add data-turbo-permanent to your sidebar element in HTML to maintain state across navigations
