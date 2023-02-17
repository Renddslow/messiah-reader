import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('chapter-container')
export class ChapterContainer extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      color: var(--chapter-container-text-color, #000);
    }
  `;

  @property({ type: Boolean }) unlocked = 'Hey there';

  @property({ type: Number }) counter = 5;

  @state() private name = 'World';

  private _onClick() {
    this.counter += 1;
  }

  render() {
    return html` <slot></slot> `;
  }
}
