'use strict'

// Class declaration ---------------------------------------------------------------------------------------
class PopupElement extends HTMLElement {
	#shadow;
	#element;
	#text;
	#arrow;

	// set properties first time
	#initiate() {
		this.#element.setAttribute('side', this.getAttribute('side'));
	}

	// reset properties
	#render() {
		this.style.display = (this.getAttribute('visible') === 'true') ? 'block' : 'none';

		let style = window.getComputedStyle(this);
		this.#text.style.border = style.border;
		this.#arrow.style.border = style.border;
		this.#arrow.style.backgroundColor = style.borderColor;
		this.#text.style.backgroundColor = style.backgroundColor;
	}

	//set elements visuals
	constructor() {
		super();
		this.#shadow = this.attachShadow({mode: 'closed'});
		this.#shadow.append(document.getElementById('popup-element').content.cloneNode(true));
		this.#element = this.#shadow.getElementById('popup');
		this.#text = this.#shadow.getElementById('popup-text');
		this.#arrow = this.#shadow.getElementById('arrow');
	}

	connectedCallback() {
		setTimeout(() => {
			this.#initiate();
			this.#text.innerHTML = this.textContent;
			this.#render();
		});
	}

	static get observedAttributes() {
		return ['visible', 'color', 'border-color'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
	}
}

// Executable part ---------------------------------------------------------------------------------------

customElements.define('pop-up', PopupElement);