'use strict'

// get DOM objects ----------------------------------------------------------------------------------------------------
let mainDOMElements = {
	main: {
		picContainer: document.getElementById('pic-container-main'),
		menu: document.getElementById("menu"),
		galleriesList: document.getElementById('galleries-list'),
		delete: {
			container: document.getElementById('delete-container'),
			zone: document.getElementById('delete-zone'),
		},
		header: {
			container: document.getElementById('header'),
			galleryName: document.getElementById('item-header-gallery-name'),
			galleryDesc: document.getElementById('item-header-gallery-description'),
		}
	},
	modal: {
		screen: document.getElementById("modal"),
		inputTextSearch: document.getElementById('input-text-query'),
		imgGridContainer: document.getElementById('pic-container-modal'),
	},
	loaderScreen: document.getElementById("loading-container"),
	newGallery: {
		screen: document.getElementById('create-new-gall-container'),
		iconsList: document.getElementById('icons-container'),
		nameInput: document.getElementById('gallery-name-input'),
		descInput: document.getElementById('gallery-desc-input'),
	},
	templates: {
		selectableIcon: document.getElementById('selectable-icon'),
		menuElement: document.getElementById('menu-element'),
		popupElement: document.getElementById('popup-element'),
	}
};

objectMixIn(mainDOMElements.modal);

// asset icons for new-gallery-menu ---------------------------------------------------------------------------------------
for (let iconCode of iconsArray) {
	let icon = document.createElement('sel-icon');
	icon.dataset.iconCode = iconCode;
	mainDOMElements.newGallery.iconsList.appendChild(icon);
}

// DOM control's classes ----------------------------------------------------------------------------------------------
class ModalInputElementsControl {
	constructor(elem) {
		elem.addEventListener('click', this.onClick.bind(this));
	}

	search() {
		startSearch(mainDOMElements.modal.inputTextSearch.value);
	}

	pageNext() {
		nextSearch();
	}

	pagePrev() {
		prevSearch();
	}

	closeModal() {
		mainDOMElements.modal.screen.style.display = 'none';
		mainDOMElements.modal.dispatchCustomEvent('hide');
	}

	commitSelected() {
		galleriesManager.addSelectedImgElements(galleriesCollection.lastAccessed, selectedImgModal);
		galleriesManager.showGallery(galleriesCollection.lastAccessed);
		selectedImgModal.dispatchCustomEvent('clear');
		mainDOMElements.modal.screen.style.display = 'none';
		mainDOMElements.modal.dispatchCustomEvent('hide');
	}

	clearSelected() {
		selectedImgModal.dispatchCustomEvent('clear');
	}

	onClick(event) {
		let action = event.target.dataset.action;
		if (action) {
			this[action]();
		}
	};
}

class MenuInputElementsControl {
	constructor(elem) {
		elem.addEventListener('click', this.onClick.bind(this));
	}

	addImages() {
		mainDOMElements.modal.screen.style.display = "block";
		mainDOMElements.modal.dispatchCustomEvent('show');
	}

	imageViewFull() {
		mainDOMElements.main.picContainer.dataset.imageSize = 'full';
	}

	imageViewLarge() {
		mainDOMElements.main.picContainer.dataset.imageSize = 'row_large';
	}

	imageViewMedium() {
		mainDOMElements.main.picContainer.dataset.imageSize = 'row_medium';
	}

	imageViewSmall() {
		mainDOMElements.main.picContainer.dataset.imageSize = 'row_small';
	}

	newGallery() {
		mainDOMElements.newGallery.iconsList.dispatchEvent(new CustomEvent('iconChange'));
		mainDOMElements.newGallery.iconsList.firstElementChild.select();
		mainDOMElements.newGallery.nameInput.value = null;
		mainDOMElements.newGallery.descInput.value = null;
		mainDOMElements.newGallery.screen.style.display = "block";
	}

	onClick(event) {
		let action = event.target.dataset.action;
		if (action) {
			this[action]();
		}
	};
}

class CreateGalleryModalInputElementsControl {
	constructor(elem) {
		elem.addEventListener('click', this.onClick.bind(this));
	}

	// todo add validation of gallery name
	confirm() {
		let name = mainDOMElements.newGallery.nameInput.value.trim();
		let desc = mainDOMElements.newGallery.descInput.value.trim();
		let iconCode = mainDOMElements.newGallery.iconsList.selectedIcon;
		if (!name || !iconCode || galleriesCollection.has(name)) {
			return;
		}
		galleriesManager.addNewGallery({
			name: name,
			icon: iconCode,
			description: desc,
			imageURLarr: [],
			changed: new Date(),
			created: new Date(),
		});
		mainDOMElements.newGallery.screen.style.display = 'none';
	}

	decline() {
		mainDOMElements.newGallery.screen.style.display = 'none';
	}

	onClick(event) {
		let action = event.target.dataset.action;
		if (action) {
			this[action]();
		}
	};
}

// Assign DOM's controls ----------------------------------------------------------------------------------------------
new ModalInputElementsControl(mainDOMElements.modal.screen);
new MenuInputElementsControl(mainDOMElements.main.menu);
new CreateGalleryModalInputElementsControl(mainDOMElements.newGallery.screen);
