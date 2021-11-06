'use strict'

//---------------------------------------------------------------------------------------------------------------------
let mainDOMElements = {
    main: {
        picContainer: document.getElementById('pic-container-main'),
        menu: document.getElementById("menu"),
    },
    modal: {
        screen: document.getElementById("modal"),
        inputTextSearch: document.getElementById('input-text-query'),
        imgGridContainer: document.getElementById('pic-container-modal'),
    },
    loaderScreen: document.getElementById("loading-container"),
};

objectMixIn(mainDOMElements.modal);

//---------------------------------------------------------------------------------------------------------------------
class ModalInputElementsControl {
    constructor(elem) {
        elem.onclick = this.onClick.bind(this);
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
        galleriesCollection.lastAccessed.addImages(selectedImgModal);
        showGallery(galleriesCollection.lastAccessed);
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
        elem.onclick = this.onClick.bind(this);
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

    onClick(event) {
        let action = event.target.dataset.action;
        if (action) {
            this[action]();
        }
    };
}

//---------------------------------------------------------------------------------------------------------------------
new ModalInputElementsControl(mainDOMElements.modal.screen);
new MenuInputElementsControl(mainDOMElements.main.menu);

//---------------------------------------------------------------------------------------------------------------------