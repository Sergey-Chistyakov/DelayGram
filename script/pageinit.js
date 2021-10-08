'use strict'

//---------------------------------------------------------------------------------------------------------------------
let mainDOMElements = {
    main: {
        btn: document.getElementById("button"),
        btnOpenLoader: document.getElementById('buttonOpenLoader'),
        picContainer: document.getElementById('pic-container-main'),
    },
    modal: {
        screen: document.getElementById("modal"),
        inputTextSearch: document.getElementById('input-text-query'),
        imgGridContainer: document.getElementById('pic-container-modal'),
    },
    loaderScreen: document.getElementById("loading-container"),
};

//---------------------------------------------------------------------------------------------------------------------
class ModalInputElementsControll {
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
    }

    commitSelected() {
        // alert(`Commit selected\nSelected: ${selectedImgModal.size}`);
        galleriesCollection.lastAccessed.addImages(selectedImgModal);
        showGallery(galleriesCollection.lastAccessed);
        selectedImgModal.dispatchCustomEvent('clear');
        mainDOMElements.modal.screen.style.display = 'none';
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

//---------------------------------------------------------------------------------------------------------------------
new ModalInputElementsControll(mainDOMElements.modal.screen);


//---------------------------------------------------------------------------------------------------------------------
mainDOMElements.main.btn.onclick = function () {
    mainDOMElements.modal.screen.style.display = "block";
}

mainDOMElements.main.btnOpenLoader.onclick = function () {
    mainDOMElements.loaderScreen.style.display = 'block';
}

mainDOMElements.loaderScreen.onclick = function () {
    mainDOMElements.loaderScreen.style.display = 'none';
}