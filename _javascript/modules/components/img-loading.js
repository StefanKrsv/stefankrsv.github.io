/**
 * Setting up image lazy loading and LQIP switching with Turbo support
 */

const ATTR_DATA_SRC = 'data-src';
const ATTR_DATA_LQIP = 'data-lqip';

const cover = {
  SHIMMER: 'shimmer',
  BLUR: 'blur'
};

function removeCover(clzss) {
  this.parentElement?.classList.remove(clzss);
}

function handleImage() {
  if (!this.complete) {
    return;
  }

  if (this.hasAttribute(ATTR_DATA_LQIP)) {
    removeCover.call(this, cover.BLUR);
  } else {
    removeCover.call(this, cover.SHIMMER);
  }
}

/**
 * Switches the LQIP with the real image URL.
 */
function switchLQIP() {
  const src = this.getAttribute(ATTR_DATA_SRC);
  this.setAttribute('src', encodeURI(src));
  this.removeAttribute(ATTR_DATA_SRC);
}

function initializeImages() {
  const images = document.querySelectorAll('article img');

  if (images.length === 0) {
    return;
  }

  images.forEach((img) => {
    // Remove existing listeners to prevent duplicates
    img.removeEventListener('load', handleImage);
    img.addEventListener('load', handleImage);
  });

  // Handle images loaded from browser cache
  document.querySelectorAll('article img[loading="lazy"]').forEach((img) => {
    if (img.complete) {
      removeCover.call(img, cover.SHIMMER);
    }
  });

  // Handle LQIP images
  const lqips = document.querySelectorAll(
    `article img[${ATTR_DATA_LQIP}="true"]`
  );

  if (lqips.length) {
    lqips.forEach((lqip) => {
      switchLQIP.call(lqip);
    });
  }
}

export function loadImg() {
  // Initial load
  initializeImages();
  console.log('img load');
  // Handle Turbo navigation events
  document.addEventListener('turbo:load', initializeImages);
  document.addEventListener('turbo:render', initializeImages);
}
