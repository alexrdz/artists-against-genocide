/**
 * Elemental Demo Engine (Vanilla JS)
 */

// Layout metadata for navigation
const ELEMENTAL_LAYOUTS = [
  { id: 'box', name: 'Box', attr: 'data-box', desc: 'Atomic container for padding, borders, and theme inversion.' },
  { id: 'stack', name: 'Stack', attr: 'data-stack', desc: 'Vertical layout managing flow and uniform spacing between elements.' },
  { id: 'cluster', name: 'Cluster', attr: 'data-cluster', desc: 'Wrapping horizontal group with consistent gap and alignment.' },
  { id: 'center', name: 'Center', attr: 'data-center', desc: 'Horizontally or vertically centered content with bounded max-width.' },
  { id: 'split', name: 'Split', attr: 'data-split', desc: 'Two-column proportioned split layout that collapses responsively.' },
  { id: 'switcher', name: 'Switcher', attr: 'data-switcher', desc: 'Switches between horizontal row and vertical stack based on threshold or item count.' },
  { id: 'frame', name: 'Frame', attr: 'data-frame', desc: 'Fixed aspect-ratio container for media, cards, and responsive visuals.' },
  { id: 'cover', name: 'Cover', attr: 'data-cover', desc: 'Full-viewport or fractional cover layout with centered principal element.' },
  { id: 'container', name: 'Container', attr: 'data-container', desc: 'Max-width page wrapper with standard responsive gutter paddings.' },
  { id: 'masonry', name: 'Masonry', attr: 'data-masonry', desc: 'Multi-column masonry cascade layout for variable-height cards.' },
  { id: 'media', name: 'Media', attr: 'data-media', desc: 'Classic media object combining fixed visual asset with flexible content.' },
  { id: 'clamp', name: 'Clamp', attr: 'data-clamp', desc: 'Inline width clamp with percentage constraints and directional alignment.' },
  { id: 'row', name: 'Row', attr: 'data-row', desc: 'Flex-based equal or fractional column row with wrapping minimums.' },
  { id: 'grid', name: 'Grid', attr: 'data-grid', desc: 'CSS Grid with auto-fitting responsive columns and defined min-widths.' },
  { id: 'reel', name: 'Reel', attr: 'data-reel', desc: 'Horizontal scrollable gallery with scroll-snap and visible item counts.' },
  { id: 'flanked', name: 'Flanked', attr: 'data-flanked', desc: 'Sidebar-plus-content layout with dynamic folding when space is constrained.' },
  { id: 'imposter', name: 'Imposter', attr: 'data-imposter', desc: 'Overlay object positioned centrally over viewport or container with bounds containment.' },
  { id: 'icon', name: 'Icon', attr: 'data-icon', desc: 'Inline icon aligner matching line-height and font metric baselines.' }
];

class ElementalDemo {
  constructor(options = {}) {
    this.layoutId = options.layoutId || '';
    this.targetSelector = options.targetSelector || '#layout-target';
    this.codeDrawer = document.getElementById('code-drawer');
    this.codeDisplay = document.getElementById('code-display');
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.codeToggleBtn = document.getElementById('code-toggle');
    this.navSelect = document.getElementById('nav-select');
    this.copyBtn = document.getElementById('copy-code-btn');

    this.initTheme();
    this.initNavigation();
    this.initCodeDrawer();
    this.initViewportControls();
    this.updateCode();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('elemental-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('elemental-theme', next);
        this.updateThemeButton(next);
      });
    }
  }

  updateThemeButton(theme) {
    if (!this.themeToggleBtn) return;
    this.themeToggleBtn.innerHTML = theme === 'light' 
      ? '<span>🌙</span> Dark' 
      : '<span>☀️</span> Light';
  }

  initNavigation() {
    if (!this.navSelect) return;
    
    // Clear and populate dropdown
    this.navSelect.innerHTML = '<option value="index.html">☰ All Layouts</option>';
    
    // Add responsive lab option
    const respOpt = document.createElement('option');
    respOpt.value = 'responsive-viewer.html';
    respOpt.textContent = '📐 Responsive Device Sandbox';
    this.navSelect.appendChild(respOpt);

    ELEMENTAL_LAYOUTS.forEach(layout => {
      const opt = document.createElement('option');
      opt.value = `${layout.id}.html`;
      opt.textContent = `${layout.name} (${layout.attr})`;
      if (layout.id === this.layoutId) {
        opt.selected = true;
      }
      this.navSelect.appendChild(opt);
    });

    this.navSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        window.location.href = e.target.value;
      }
    });
  }

  initViewportControls() {
    if (this.layoutId === 'index' || this.layoutId === 'responsive-viewer') return;

    const stageWrapper = document.querySelector('.demo-stage-wrapper');
    const stageContainer = document.querySelector('.demo-stage-container');
    if (!stageWrapper || !stageContainer) return;

    // Check if toolbar already exists, if not, inject it
    let toolbar = document.querySelector('.demo-viewport-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'demo-viewport-toolbar';
      toolbar.innerHTML = `
        <div class="demo-viewport-presets">
          <button class="demo-viewport-btn" data-width="375">📱 Mobile (375px)</button>
          <button class="demo-viewport-btn" data-width="768">📱 Tablet (768px)</button>
          <button class="demo-viewport-btn" data-width="1024">💻 Laptop (1024px)</button>
          <button class="demo-viewport-btn active" data-width="100%">🖥️ Full (100%)</button>
        </div>
        <div class="demo-viewport-slider-group">
          <span class="demo-viewport-label">Container:</span>
          <input type="range" class="demo-viewport-slider" id="demo-viewport-range" min="320" max="1400" value="1400">
          <span class="demo-viewport-badge" id="demo-viewport-badge">100%</span>
        </div>
      `;
      
      const descBar = stageWrapper.querySelector('.demo-desc-bar');
      if (descBar) {
        stageWrapper.insertBefore(toolbar, descBar.nextSibling);
      } else {
        stageWrapper.insertBefore(toolbar, stageWrapper.firstChild);
      }
    }

    // Add draggable resize handle to stageContainer if not present
    if (!stageContainer.querySelector('.demo-stage-resizer')) {
      const resizer = document.createElement('div');
      resizer.className = 'demo-stage-resizer';
      resizer.title = 'Drag to resize container width';
      stageContainer.appendChild(resizer);

      // Drag resize functionality
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;

      resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = stageContainer.offsetWidth;
        stageContainer.classList.add('dragging');
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = (e.clientX - startX) * 2; // symmetric from center
        const newWidth = Math.max(320, Math.min(stageWrapper.offsetWidth - 60, startWidth + deltaX));
        stageContainer.style.maxWidth = `${newWidth}px`;
        stageContainer.style.width = `${newWidth}px`;
        updateSliderAndBadge(newWidth);
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          stageContainer.classList.remove('dragging');
          document.body.style.cursor = '';
        }
      });
    }

    const rangeInput = document.getElementById('demo-viewport-range');
    const badge = document.getElementById('demo-viewport-badge');
    const presetBtns = toolbar.querySelectorAll('.demo-viewport-btn');

    const updateSliderAndBadge = (widthPx, isPercent = false) => {
      if (badge) {
        badge.textContent = isPercent ? '100%' : `${Math.round(widthPx)}px`;
      }
      if (rangeInput && !isPercent) {
        rangeInput.value = Math.round(widthPx);
      }
    };

    // Update max range based on stageWrapper width
    const refreshRangeMax = () => {
      if (rangeInput) {
        const maxAvailable = stageWrapper.offsetWidth - 64;
        rangeInput.max = Math.max(1200, maxAvailable);
        if (stageContainer.style.maxWidth === '100%' || !stageContainer.style.maxWidth) {
          rangeInput.value = rangeInput.max;
        }
      }
    };
    refreshRangeMax();
    window.addEventListener('resize', refreshRangeMax);

    // Preset button clicks
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const widthVal = btn.dataset.width;
        if (widthVal === '100%') {
          stageContainer.style.maxWidth = '100%';
          stageContainer.style.width = '100%';
          updateSliderAndBadge(stageContainer.offsetWidth, true);
        } else {
          stageContainer.style.maxWidth = `${widthVal}px`;
          stageContainer.style.width = `${widthVal}px`;
          updateSliderAndBadge(parseInt(widthVal, 10));
        }
      });
    });

    // Range slider input
    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        presetBtns.forEach(b => b.classList.remove('active'));
        if (val >= parseInt(rangeInput.max, 10) - 20) {
          stageContainer.style.maxWidth = '100%';
          stageContainer.style.width = '100%';
          updateSliderAndBadge(stageContainer.offsetWidth, true);
          const fullBtn = toolbar.querySelector('[data-width="100%"]');
          if (fullBtn) fullBtn.classList.add('active');
        } else {
          stageContainer.style.maxWidth = `${val}px`;
          stageContainer.style.width = `${val}px`;
          updateSliderAndBadge(val);
        }
      });
    }
  }

  initCodeDrawer() {
    if (!this.codeDrawer) return;

    // Ensure header has title and action buttons (copy + close)
    const header = this.codeDrawer.querySelector('.demo-code-header');
    if (header) {
      const existingTitle = header.querySelector('.demo-code-title');
      if (existingTitle) {
        existingTitle.innerHTML = '<span>&lt;/&gt;</span> Live HTML Output';
      }

      let actionsWrapper = header.querySelector('.demo-code-actions');
      if (!actionsWrapper) {
        actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'demo-code-actions';
        
        // Move copy button inside actionsWrapper if present
        if (this.copyBtn) {
          actionsWrapper.appendChild(this.copyBtn);
        }

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'demo-close-drawer-btn';
        closeBtn.id = 'close-drawer-btn';
        closeBtn.title = 'Close code drawer (Esc)';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => {
          this.closeCodeDrawer();
        });
        actionsWrapper.appendChild(closeBtn);

        header.appendChild(actionsWrapper);
      }
    }

    if (this.codeToggleBtn) {
      this.codeToggleBtn.addEventListener('click', () => {
        const isOpen = this.codeDrawer.classList.toggle('open');
        this.codeToggleBtn.classList.toggle('active', isOpen);
      });
    }

    if (this.copyBtn && this.codeDisplay) {
      this.copyBtn.addEventListener('click', () => {
        const text = this.codeDisplay.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const orig = this.copyBtn.innerHTML;
          this.copyBtn.innerHTML = '<span>✓</span> Copied!';
          setTimeout(() => {
            this.copyBtn.innerHTML = orig;
          }, 2000);
        });
      });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.codeDrawer.classList.contains('open')) {
        this.closeCodeDrawer();
      }
    });
  }

  closeCodeDrawer() {
    if (this.codeDrawer) {
      this.codeDrawer.classList.remove('open');
    }
    if (this.codeToggleBtn) {
      this.codeToggleBtn.classList.remove('active');
    }
  }

  updateCode() {
    const target = document.querySelector(this.targetSelector);
    if (!target || !this.codeDisplay) return;

    // Clone element to clean up any internal ephemeral elements
    const clone = target.cloneNode(true);

    // Clean up empty or redundant style attributes on clone and children
    const cleanStyles = (el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr !== null) {
        const trimmed = styleAttr.trim();
        if (!trimmed) {
          el.removeAttribute('style');
        }
      }
      Array.from(el.children).forEach(cleanStyles);
    };
    cleanStyles(clone);

    const htmlSnippet = this.formatHTML(clone.outerHTML);
    this.codeDisplay.textContent = htmlSnippet;
  }

  formatHTML(html) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    html.split(/>\s*</).forEach(element => {
      if (element.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      formatted += indent + '<' + element + '>\n';
      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith('input') && !element.startsWith('img') && !element.startsWith('hr') && !element.startsWith('br')) {
        indent += tab;
      }
    });
    return formatted.substring(1, formatted.length - 2);
  }

  setContainerItems(count, templateFn) {
    const target = document.querySelector(this.targetSelector);
    if (!target) return;
    target.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      target.insertAdjacentHTML('beforeend', templateFn(i));
    }
    this.updateCode();
  }
}

// Global helper for single-line setup
window.ElementalDemo = ElementalDemo;
