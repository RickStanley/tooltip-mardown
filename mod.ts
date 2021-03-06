import { html, render, nothing, TemplateResult } from "lit-html";
import { Converter } from "showdown";

type stringOrElement = string | HTMLInputElement | HTMLTextAreaElement;

class TooltipMarkdown {
  public root: HTMLElement;
  public original: HTMLElement = null;
  private toggleOpen: boolean

  constructor({ element, output }: { element: stringOrElement; output?: stringOrElement; }) {

    if (typeof element !== "string") {
      if ("length" in element) throw new Error("Can't be an array-like. A single element or string query only.");
      let newElement: HTMLElement = null;
      if (element.tagName !== "DIV") {
        let converter = new Converter();
        newElement = document.createElement("div");
        newElement.contentEditable = "true";
        // May think of a better way to get from a existing source
        // I made this specifically for my use case, where I fetched
        // some persistent data from my database, placed the markdown as a value in a TextArea
        // and then convert back to HTML so the admin could manipulate, and would ease the steps
        // if the textarea was inside an form, so it could be ease as just converting to FormData
        // and completing the circle.
        newElement.innerHTML = converter.makeHtml(element.innerText || element.value);
        element.insertAdjacentElement("beforebegin", newElement);
        this.original = element;
      }
      this.root = newElement || element;
    } else {
      this.root = document.querySelector(element);
    }

    const wrap = document.createElement("div");
    wrap.id = "tooltip-reference";

    // Clone here so we can leave the original reference behind.
    document.body.appendChild(wrap.cloneNode(true));

    // @todo Should be elsewhere within this class
    window.addEventListener('click', (e) => {
      if (!this.toggleOpen) {
        render(nothing, document.querySelector('#tooltip-reference'));
      } else this.toggleOpen = false;
    });

    // @todo Should be elsewhere within this class
    this.root.addEventListener("mouseup", (e) => {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const count = range.endOffset - range.startOffset;
      if (rect.width > 0 && count) {
        this.toggleOpen = true;
        render(this.makeTooltip(rect.x + (rect.width / 2), rect.y), document.querySelector("#tooltip-reference"));
      }
    });
  }

  private boldfy(): void {
    const selection = window.getSelection();
    console.log(selection.getRangeAt(0));
    
    const range = selection.getRangeAt(0).cloneRange();
    range.surroundContents(document.createElement('b'));
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private italify(): void {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).cloneRange();
    range.surroundContents(document.createElement('i'));
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // @todo We need to center the tooltip
  private makeTooltip(x: number, y: number): TemplateResult {
    return html`
    <style>
      .tooltip-container * {
        box-sizing: inherit;
      }

      .tooltip-container {
        box-sizing: border-box;
        position: fixed;
        top: var(--y);
        left: var(--x);
        animation: opacity .2s ease forwards, popUp .2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      }

      .tooltip-container::before,
      .tooltip-container::after {
        display: block;
        width: 0;
        height: 0;
        border: 0 solid transparent;
        margin: 0 auto;
        border-left-width: 6px;
        border-right-width: 6px;
      }

      .tooltip-container::after {
        content: '';
        border-top: 10px solid var(--tooltip-bg-color, #dddddd);
        top: 100%;
      }

      .tooltip-container::before {
        border-bottom: 10px solid var(--tooltip-bg-color, #dddddd);
        bottom: 100%;
      }

      .tooltip-container.bottom::after {
        content: none;
      }

      .tooltip-container.bottom::before {
        content: '';
      }

      .tooltip-container.bottom {
        animation: opacity .2s ease forwards, popDown .2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      }

      .tooltip__actions {
        display: flex;
        border-radius: 3px;
        overflow: hidden;
      }

      .tooltip__action {
        margin: 0;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0;
        background-color: var(--tooltip-bg-color, #dddddd);
        font-weight: 500;
        padding: 0;
        color: inherit;
        cursor: pointer;
        border: 0;
        -webkit-appearance: none;
        appearance: none;
      }

      .tooltip__action:hover,
      .tooltip__action:focus {
        background-color: var(--action-hover, #e6e6e6);
      }

      @keyframes popUp {
        from {
          transform: translateY(0%) translateX(-50%) translateZ(0);
        }
        to {
          transform: translateY(-100%) translateX(-50%) translateZ(0);
        }
      }
      @keyframes popDown {
        from {
          transform: translateY(-100%) translateX(-50%) translateZ(0);
        }
        to {
          transform: translateY(0%) translateX(-50%) translateZ(0);
        }
      }
      @keyframes fadeIn {
        to {
          opacity: 1;
        }
      }
    </style>
    <div class="tooltip-container ${y < 50 ? 'bottom' : ''}" style="--x: ${~~(x)}px;--y:${~~(y < 50 ? y + (8 + 6) : y)}px;">
      <div class="tooltip__actions">
        <button class="tooltip__action" @click=${this.boldfy}>B</button>
        <button class="tooltip__action" @click=${this.italify}>I</button>
      </div>
    </div>`;
  }

}

// Debug only
const a = new TooltipMarkdown({ element: '.conteudo' });