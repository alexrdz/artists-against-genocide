class SqueezeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    const style = `
      <style>
        .animation-container:has(input:checked) .squeeze {
          animation-play-state: paused;
        }

        .squeeze {
          animation: squeeze 5s infinite linear alternate;
          border: 1px solid #222;
          position: relative;
        }

        @keyframes squeeze {
          0% { width: 100%; }
          100% { width: 300px; }
        }
      </style>
    `;

    const markup = `
      <div class="animation-container">
        <label for="pause">
          pause
          <input type="checkbox" checked name="pause" id="pause" />
        </label>
        <div class="squeeze">
          <div class="flex">
            <slot></slot>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = style + markup;
  }
}

customElements.define('tm-squeeze', SqueezeComponent);
