'use strict'

// Class declaration ---------------------------------------------------------------------------------------
class SelectableIcon extends HTMLElement {
	#shadow;
	#onIconChangeDispatchBind = this.#onIconChangeDispatch.bind(this);

	#onIconChangeDispatch() {
		this.#shadow.getElementById('icon').dataset.state = 'none';
		mainDOMElements.newGallery.iconsList.removeEventListener('iconChange', this.#onIconChangeDispatchBind);
		mainDOMElements.newGallery.iconsList.selectedIcon = 'collections';
	}

	#onClick() {
		mainDOMElements.newGallery.iconsList.dispatchEvent(new CustomEvent('iconChange'));
		mainDOMElements.newGallery.iconsList.addEventListener('iconChange', this.#onIconChangeDispatchBind);
		mainDOMElements.newGallery.iconsList.selectedIcon = this.dataset.iconCode;
		this.#shadow.getElementById('icon').dataset.state = 'selected';
	}

	constructor() {
		super();
		this.#shadow = this.attachShadow({mode: 'closed'});
		this.#shadow.append(mainDOMElements.templates.selectableIcon.content.cloneNode(true));
		this.addEventListener('click', this.#onClick.bind(this));
	}

	connectedCallback() {
		if (!mainDOMElements.newGallery.iconsList.selectedIcon) mainDOMElements.newGallery.iconsList.selectedIcon = 'collections';
		this.#shadow.getElementById('icon').innerText = this.dataset.iconCode;
		if (mainDOMElements.newGallery.iconsList.selectedIcon === this.dataset.iconCode)
			this.#onClick();
	}

	select() {this.#onClick()}
}

// Executable part ---------------------------------------------------------------------------------------

customElements.define('sel-icon', SelectableIcon);