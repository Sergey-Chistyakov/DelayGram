"use strict";

const API_KEY = "AIzaSyBs3BcTa5D_otlqYjNkGud9Lwp1ktTb5qE";
const CSE = "e8e4c105a7c6c1f01";
const SEARCH_HTTP = "https://customsearch.googleapis.com/customsearch/v1?";

//--Classes------------------------------------------------------------------------------------
class ModalImagePreviewElement {
    #imageElement = null;

    get image() {
        return this.#imageElement;
    }

    get #selected() {
        return selectedImgModal.has(this.#imageElement);
    }

    get #lockedByCurrentGallery() {
        if (!this.#imageElement) return false;
        let result = false;
        galleriesCollection.lastAccessed.forEach((currentValue) => {
            if (currentValue.imageUrl == this.#imageElement.src) {
                result = true;
            }
        });
        return result;
    }


    #eventListenerRefreshLockedStatus = this.#setSelected.bind(this);

    #eventListenerClearSelected = (function () {
        selectedImgModal.delete(this.#imageElement);
        this.#setSelected();
        selectedImgModal.removeCustomEventListener(
            "clear",
            this.#eventListenerClearSelected
        );
    }).bind(this);

    set #selected(value) {
        if (this.#imageElement == null) return;
        if (galleriesCollection.lastAccessed.has(this.#imageElement.src)) {
            this.divSelectIcon.setPropertiesValues(this._options.divSelectIcon.locked);

            return;
        }
        if (value) {
            selectedImgModal.add(this.#imageElement);
            selectedImgModal.addCustomEventListener(
                "clear",
                this.#eventListenerClearSelected
            );
        } else {
            selectedImgModal.delete(this.#imageElement);
            selectedImgModal.removeCustomEventListener(
                "clear",
                this.#eventListenerClearSelected
            );
        }
    }

    _options = {
        //---------
        divOpenLightbox: {
            initial: {
                className: "triangle",
                attributesToSet: {trianglePosition: "bottom", active: "false"},
            },
        },

        //---------
        divOpenLightboxIcon: {
            initial: {
                className: "triangle-bottom icons",
                innerText: "zoom_in",
            },
        },

        //---------
        divSelect: {
            initial: {
                className: "triangle",
                attributesToSet: {trianglePosition: "top", active: "false"},
            },
        },

        //---------
        divSelectIcon: {
            initial: {
                className: "triangle-top icons",
                innerText: "done",
            },

            activated: {
                innerText: "close",
            },

            deactivated: {
                innerText: "done",
            },

            locked: {
                innerText: "lock"
            },

        },

        //---------
        divSelectionMark: {
            initial: {
                className: "selectionMark",
                innerText: "task_alt",
                attributesToSet: {active: "false"},
            },

            locked: {
                innerText: "lock",
                attributesToSet: {active: "true"},
            },

            unlocked: {
                innerText: "task_alt",
                attributesToSet: {active: "false"},
            },

        },
    };

    //set visuals
    #setSelected() {
        if (this.#selected || this.#lockedByCurrentGallery) {
            this.divSelectionMark.activated = (this.#lockedByCurrentGallery) ? 'locked' : true;
            this.divSelectIcon.setPropertiesValues(
                (this.#lockedByCurrentGallery) ? this._options.divSelectIcon.locked :
                    this._options.divSelectIcon.activated
            );
        } else {
            this.divSelectionMark.activated = false;
            this.divSelectIcon.setPropertiesValues(
                this._options.divSelectIcon.deactivated
            );
        }
    }

    constructor(imageElement = null) {
        // if imageElement exists, check cache for its class ModalImagePreviewElement instance
        if (imageElement != null && imgPreviewWeakMap.has(imageElement)) {
            return imgPreviewWeakMap.get(imageElement);
        }

        this.div = domElementMixIn(document.createElement("div"));
        this.divSelectionMark = domElementMixIn(
            document.createElement("div")
        ).setPropertiesValues(this._options.divSelectionMark.initial);
        this.divOpenLightbox = domElementMixIn(
            document.createElement("div")
        ).setPropertiesValues(this._options.divOpenLightbox.initial);
        this.divOpenLightboxIcon = domElementMixIn(
            document.createElement("div")
        ).setPropertiesValues(this._options.divOpenLightboxIcon.initial);
        this.divSelect = domElementMixIn(
            document.createElement("div")
        ).setPropertiesValues(this._options.divSelect.initial);
        this.divSelectIcon = domElementMixIn(
            document.createElement("div")
        ).setPropertiesValues(this._options.divSelectIcon.initial);

        this.div
            .addChild(this.divOpenLightbox.addChild(this.divOpenLightboxIcon))
            .addChild(this.divSelect.addChild(this.divSelectIcon))
            .addChild(this.divSelectionMark);
        if (imageElement != null) {
            this.#imageElement = imageElement;
            this.div.appendChild(imageElement);
            imgPreviewWeakMap.set(imageElement, this);
        }

        this.#selected = this.#selected; // to add event listners
        this.#setSelected(); // set visual
        mainDOMElements.modal.addCustomEventListener('show', this.#eventListenerRefreshLockedStatus);

        this.div.addEventListener("mouseover", () => {
            this.divOpenLightbox.activated = true;
            this.divSelect.activated = true;
        });

        this.div.addEventListener("mouseout", () => {
            this.divOpenLightbox.activated = false;
            this.divSelect.activated = false;
        });

        this.divSelect.addEventListener("click", () => {
            if (this.#lockedByCurrentGallery) return;
            this.#selected = !this.#selected;
            this.#setSelected();
        });
    }
}

//---------------------------------------------------------------------------------------------
class WebQueryProvider {
    #lastSearch = new Date(0);
    #searchHttp = "";
    #runs = false;
    #searchDelay = 300000; // ms
    #totalResults = null;
    #resultRequestImageUrls = []; //URL
    #resultRequestImageExtendeds = []; //DOM elements, loaded without errors

    #options = {
        cx: CSE,
        key: API_KEY,
        start: 1, // Start result for query in                    [!!! start + num must not be >100!!!!]
        num: 10, // Quantity of results from 1 to 10 only        [!!! start + num must not be >100!!!!]
        q: "", // Placeholder for query
        safe: "active", // Filter: no porn, violence etc
        filter: "1", // "no Duplicate results" filter
        searchType: "image",
        imgType: "photo",
        imgSize: "LARGE",
    };

    resultObj = {
        page: null,
        query: this.#options.q,
        navigate: null,
        imgExtResultArr: [],
    };

    get lifeTime() {
        return this.#searchDelay;
    }

    get #canSearchFurther() {
        return (
            this.#totalResults == null ||
            (this.#totalResults >= this.#options.start &&
                this.#options.start + this.#options.num < 100)
        );
    }

    async getPageResults({page = null, navigate = null} = {}) {
        if (page != null) {
            if (navigate == "next") {
                if (
                    this.#resultRequestImageExtendeds.length >= (page + 1) * 9 ||
                    this.#canSearchFurther
                )
                    page++;
                else return null;
            }
            if (navigate == "previous") {
                if (page > 1) page--;
                else return null;
            }
        }

        try {
            if (page == null) {
                await this.commit();
                page = 1;
            }
            while (
                this.#resultRequestImageExtendeds.length < page * 9 &&
                this.#canSearchFurther
                ) {
                await this.commit();
                if (this.#resultRequestImageUrls.length == 0)
                    throw new Error("Response has no results");

                let promises = [];
                this.#resultRequestImageUrls.forEach((url) => {
                    promises.push(new ImageExtended().getPromise(url, imageMap));
                });
                this.#resultRequestImageUrls.length = 0;

                let promisesResults = await Promise.allSettled(promises);
                promisesResults.forEach(({status, value, reason}) => {
                    if (status == "fulfilled")
                        this.#resultRequestImageExtendeds.push(value);
                    else {
                        console.log(`${reason}`);
                        if ("cause" in reason) console.log(`Cause: ${reason.cause}`);
                    }
                });
            }
        } catch (err) {
            if (navigate == "next" && page > 1) page--;
            if (navigate == "previous") page++;
            alert(err);
        } finally {
            this.resultObj.page = page;
            this.resultObj.query = this.#options.q;
            this.resultObj.navigate = "next";
            this.resultObj.imgExtResultArr = this.#resultRequestImageExtendeds.slice(
                (page - 1) * 9,
                page * 9
            );

            return this.resultObj;
        }
    }

    constructor(query) {
        this.#options.q = query;
    }

    async commit() {
        if (this.#runs || !this.#canSearchFurther) return;
        await this.#commit();
    }

    async #commit() {
        try {
            this.#establishQuery();
            this.#runs = true;
            let response = await fetch(this.#searchHttp);
            if (response.ok) {
                let json = await response.json();
                for (let responseItem of json.items) {
                    this.#resultRequestImageUrls.push(responseItem.link);
                }
                if ("nextPage" in json.queries && json.queries.nextPage.length == 1) {
                    this.#options.start = json.queries.nextPage[0].startIndex;
                    this.#totalResults = Number.parseInt(
                        json.queries.nextPage[0].totalResults
                    );
                }
                this.#lastSearch = Date.now();
            } else {
                if (response.status == "429")
                    throw new Error(
                        "Server response 429: \nLimit of 100 searches reached. \nNo further search in 24h alowed."
                    );
                throw new Error("Web search Error: " + response.status);
            }
        } catch (e) {
            throw e;
        } finally {
            this.#runs = false;
        }
    }

    #establishQuery() {
        this.#searchHttp = SEARCH_HTTP;
        for (let [key, value] of Object.entries(this.#options)) {
            this.#searchHttp +=
                key +
                "=" +
                (key == "q" ? value.trim().replace(/\s/gi, "+") : value) +
                "&";
        }
        this.#searchHttp = this.#searchHttp.slice(0, -1);
    }
}

//--Global collections-------------------------------------------------------------------------
let queryMap = new MapExtended(); // Cache for queries

let imgPreviewWeakMap = new WeakMap(); // modal image preview elements cache

//---------------------------------------------------------------------------------------------
function startSearch(query) {
    (async () => {
        if (!query || query.replace(/\s/gi, "").length < 3) {
            alert(
                "Search query must be three or more symbols! (whitespaces excluded)"
            );
            return;
        }
        mainDOMElements.loaderScreen.style.display = "block";
        let queryToDo = queryMap.setAndGet(query, WebQueryProvider);
        await queryToDo.getPageResults();
        fillImagesPreviewModal(queryToDo.resultObj.imgExtResultArr);
        mainDOMElements.loaderScreen.style.display = "none";
        mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
    })();
}

function nextSearch() {
    (async () => {
        let queryToDo = queryMap.lastAccessed;
        if (queryToDo == null) return;
        mainDOMElements.loaderScreen.style.display = "block";
        queryToDo.resultObj.navigate = "next";
        queryToDo
            .getPageResults(queryToDo.resultObj)
            .then((result) => {
                fillImagesPreviewModal(result?.imgExtResultArr);
                if (result != null)
                    mainDOMElements.modal.inputTextSearch.value = result.query;
            })
            .then(() => {
                mainDOMElements.loaderScreen.style.display = "none";
                mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
            });
    })();
}

function prevSearch() {
    (async () => {
        let queryToDo = queryMap.lastAccessed;
        if (queryToDo == null) return;
        mainDOMElements.loaderScreen.style.display = "block";
        queryToDo.resultObj.navigate = "previous";
        queryToDo
            .getPageResults(queryToDo.resultObj)
            .then((result) => {
                fillImagesPreviewModal(result?.imgExtResultArr);
                if (result != null)
                    mainDOMElements.modal.inputTextSearch.value = result.query;
            })
            .then(() => {
                mainDOMElements.loaderScreen.style.display = "none";
                mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
            });
    })();
}

function fillImagesPreviewModal(resultsImgArr) {
    if (resultsImgArr == undefined) return;
    mainDOMElements.modal.imgGridContainer.innerHTML = "";

    for (let imgExt of resultsImgArr) {
        mainDOMElements.modal.imgGridContainer.appendChild(
            new ModalImagePreviewElement(imgExt).div
        );
    }
}
