'use strict'

//---------------------------------------------------------------------------------------------------------------------
let mainDOMElements = {
    main: {
        btn: document.getElementById("button"),
        btnOpenLoader: document.getElementById('buttonOpenLoader'),
    },
    modal: {
        screen: document.getElementById("modal"),
        inputTextSearch: document.getElementById('input-text-query'),
        buttonSearchNext: document.getElementById('next-images-page'),
        buttonSearch: document.getElementById('button-query-search'),
        buttonCloseModalScreen: document.getElementById("buttonCloseModal"),
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

    pagePrev(){
        prevSearch();
    }

    closeModal() {
        mainDOMElements.modal.screen.style.display = 'none';
    }

    commitSelected(){
        alert('selection Commit');
        mainDOMElements.modal.screen.style.display = 'none';
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