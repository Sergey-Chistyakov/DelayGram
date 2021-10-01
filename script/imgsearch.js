'use strict'

const API_KEY = 'AIzaSyBs3BcTa5D_otlqYjNkGud9Lwp1ktTb5qE';
const CSE = 'e8e4c105a7c6c1f01';
const SEARCH_HTTP = 'https://customsearch.googleapis.com/customsearch/v1?';

//------------------------------------------------------------------------------------------
class ImageExtended extends Image {
    setSRC(srcToSet) {
        this.src = srcToSet;
        this.alt = '';
        return this;
    }

    promise(srcToSet = null, mapToCheck = null) {
        let promise = new Promise(((resolve, reject) => {
            if (srcToSet == null) {
                reject(new Error('No image URL!'));
            }
            if (mapToCheck != null && mapToCheck.has(srcToSet)) {
                if (mapToCheck.get(srcToSet) instanceof Error)
                    reject(new Error('Failed to load image'));
                if (mapToCheck.get(srcToSet).complete)
                    resolve(mapToCheck.get(srcToSet));
            }
            this.onload = () => {
                if (mapToCheck != null) {
                    mapToCheck.set(srcToSet, this);
                    setTimeout(() => {
                        mapToCheck.delete(srcToSet);
                    }, 900000); //clear cache after 15 minuts
                }
                resolve(this);
            };
            this.onerror = () => {
                if (mapToCheck != null) mapToCheck.set(srcToSet, new Error('Failed to load image'));
                reject(new Error('Failed to load image'));
            };
            this.src = srcToSet;
        }));
        return promise;
    }
}

class MapExtended extends Map {
    constructor() {
        super();
        this.lastAccessed = null;
    }

    setAndGet(value, TypeConstructor) {
        if (!this.has(value)) this.set(value, new TypeConstructor(value));
        this.lastAccessed = this.get(value);
        return this.get(value);
    }
}

class ModalImagePreviewElement {

    _selected = false;
    _options = {
        //---------
        divOpenLightbox: {
            initial: {
                className: 'triangle',
                attributesToSet: {trianglePosition: 'bottom', active: 'false',},
            },
        },

        //---------
        divOpenLightboxIcon: {
            initial: {
                className: 'triangle-bottom icons',
                innerText: 'zoom_in',
            },
        },

        //---------
        divSelect: {
            initial: {
                className: 'triangle',
                attributesToSet: {trianglePosition: 'top', active: 'false',},
            },
        },

        //---------
        divSelectIcon: {
            initial: {
                className: 'triangle-top icons',
                innerText: 'done',
            },
            activated: {
                innerText: 'close',
            },
            deactivated: {
                innerText: 'done',
            },
        },

        //---------
        divSelectionMark: {
            initial: {
                className: 'selectionMark',
                innerText: 'task_alt',
                attributesToSet: {active: 'false'},
            },
        },
    };

    constructor(imgUrl = null) {
        this.div = objectWrapper(document.createElement('div'));
        this.divSelectionMark = objectWrapper(document.createElement('div'))
            .setPropertiesValues(this._options.divSelectionMark.initial);
        this.divOpenLightbox = objectWrapper(document.createElement('div'))
            .setPropertiesValues(this._options.divOpenLightbox.initial);
        this.divOpenLightboxIcon = objectWrapper(document.createElement('div'))
            .setPropertiesValues(this._options.divOpenLightboxIcon.initial);
        this.divSelect = objectWrapper(document.createElement('div'))
            .setPropertiesValues(this._options.divSelect.initial);
        this.divSelectIcon = objectWrapper(document.createElement('div'))
            .setPropertiesValues(this._options.divSelectIcon.initial);

        this.div.addChild(this.divOpenLightbox.addChild(this.divOpenLightboxIcon))
            .addChild(this.divSelect.addChild(this.divSelectIcon))
            .addChild(this.divSelectionMark);

        this.div.addEventListener('mouseover', () => {
            this.divOpenLightbox.activated = true;
            this.divSelect.activated = true;
        });

        this.div.addEventListener('mouseout', () => {
            this.divOpenLightbox.activated = false;
            this.divSelect.activated = false;
        });

        this.divSelect.addEventListener('click', () => {
            if (this._selected) {
                this.divSelectionMark.activated = false;
                this.divSelectIcon.setPropertiesValues(this._options.divSelectIcon.deactivated);
                this._selected = false;
            } else {
                this.divSelectionMark.activated = true;
                this.divSelectIcon.setPropertiesValues(this._options.divSelectIcon.activated);
                this._selected = true;
            }
        });
    }
}

function objectWrapper(objToWrapp) {
    Object.defineProperties(objToWrapp, {

        'setPropertiesValues': {
            value: function (propertiesObj = {}) {
                if (Object.keys(propertiesObj).length < 1) return this;
                for (let key in propertiesObj) {
                    try {
                        if (typeof propertiesObj[key] === 'object' && propertiesObj[key] !== null) {
                            if (key == 'attributesToSet') this.setCustomAttributes(propertiesObj[key]);
                            else {
                                if (!(key in this)) this[key] = {};
                                this.setPropertiesValues.call(this[key], propertiesObj[key]);
                            }
                        } else this[key] = propertiesObj[key];
                    } catch (err) {
                        console.log(err);
                    }
                }
                return this;
            }
        },

        'addChild': {
            value: function (child) {
                if (!child.hasOwnProperty('addChild')) objectWrapper(child);
                this.appendChild(child);
                return this;
            }
        },

        'setCustomAttributes': {
            value: function (customAttrObj) {
                for (let [key, value] of Object.entries(customAttrObj)) this.setAttribute(key, value);
            },
        },

        'activated': {
            set: function (setActive = true) {
                this.setAttribute('active', setActive.toString());
            },
        },
    });
    return objToWrapp;
}

//------------------------------------------------------------------------------------------
let imageMap = new MapExtended(); // Cache for images
let queryMap = new MapExtended(); // Cache for queries
let modalImagePreviewMap = new MapExtended(); // Modal images preview collection

//------------------------------------------------------------------------------------------
class WebQueryProvider {
    #lastSearch = new Date(0);
    #searchHttp = '';
    #runs = false;
    #searchDelay = 300000;              // ms
    #totalResults = null;
    #resultRequestImageUrls = [];       //URL
    #resultRequestImageExtendeds = [];  //DOM elements, loaded without errors

    #options = {
        cx: CSE,
        key: API_KEY,
        start: 1,               // Start result for query in                    [!!! start + num must not be >100!!!!]
        num: 10,                // Quantity of results from 1 to 10 only        [!!! start + num must not be >100!!!!]
        q: "",                  // Placeholder for query
        safe: "active",         // Filter: no porn, violence etc
        filter: "1",            // "no Duplicate results" filter
        searchType: "image",
        imgType: "photo",
        imgSize: "LARGE",
    }

    resultObj = {
        page: null,
        query: this.#options.q,
        navigate: null,
        imgExtResultArr: [],
    }

    get #canSearchFurther() {
        return this.#totalResults == null || (this.#totalResults >= this.#options.start && this.#options.start + this.#options.num < 100);
    }

//TODO add errors: all possible results shown already, user on first page of results, ...
    async getPageResults({
                             page = null,
                             navigate = null,
                         } = {}) {
        try {
            if (page == null) {
                await this.commit();
                page = 1;
            }

            //todo precheck if can go further
            if (navigate == 'next') page++;
            if (navigate == 'previous' && page > 1) page--;

            while (this.#resultRequestImageExtendeds.length < page * 9 && this.#canSearchFurther) {
                await this.commit();
                if (this.#resultRequestImageUrls.length == 0) throw new Error('Response has no results');

                let promises = [];
                this.#resultRequestImageUrls.forEach((url) => {
                    promises.push(new ImageExtended().promise(url, imageMap));
                });
                this.#resultRequestImageUrls.length = 0;

                let promisesResults = await Promise.allSettled(promises);
                promisesResults.filter(({status}) => {
                    return status == 'fulfilled';
                }).forEach(({value}) => {
                    this.#resultRequestImageExtendeds.push(value);
                });
            }

        } catch (err) {
            alert(err);
        } finally {
            this.resultObj.page = page;
            this.resultObj.query = this.#options.q;
            this.resultObj.navigate = 'next';
            this.resultObj.imgExtResultArr = this.#resultRequestImageExtendeds.slice((page - 1) * 9, page * 9 + 1);

            return this.resultObj;
        }
    }

    constructor(query) {
        this.#options.q = query;
    }

    async commit() {
        if (this.#runs || !this.#canSearchFurther /*|| (Date.now() - this.#lastSearch < this.#searchDelay)*/) return;
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
                if ('nextPage' in json.queries && json.queries.nextPage.length == 1) {
                    this.#options.start = json.queries.nextPage[0].startIndex;
                    this.#totalResults = Number.parseInt(json.queries.nextPage[0].totalResults);
                }
                this.#lastSearch = Date.now();
            } else {
                throw new Error("Web search Error: " + response.status);
            }
        } catch (e) {
            alert(e);
        } finally {
            this.#runs = false;
        }
    }

    #establishQuery() {
        this.#searchHttp = SEARCH_HTTP;
        for (let [key, value] of Object.entries(this.#options)) {
            this.#searchHttp += key + '=' + ((key == 'q') ? value.trim().replace(/\s/ig, '+') : value) + '&';
        }
        this.#searchHttp = this.#searchHttp.slice(0, -1);
    }
}


//-TEST MAIN EXECUTABLE FUNCTION------------------------------------------------------------

let results = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Supermoon_Nov-14-2016-minneapolis.jpg/1200px-Supermoon_Nov-14-2016-minneapolis.jpg',
    'https://phantom-marca.unidadeditorial.es/d3c076d28d2768328f83c297d722ddcb/crop/268x219/1257x776/f/jpg/assets/multimedia/imagenes/2021/07/23/16270444581760.jpg',
    'https://www.refinery29.com/images/10279335.jpg',
    'https://upload.wikimedia.org/wikipedia/ru/a/ad/Heartbreak_on_a_Full_Moon.jpg',
    'https://cdn1.ozone.ru/s3/multimedia-z/c1200/6058507955.jpg',
    'https://c.tadst.com/gfx/600x337/full-moon-phase.png?1',
    'https://www.popsci.com/uploads/2021/07/22/full-moon-griffin-wooldridge.jpg',
    'https://www.thelist.com/img/gallery/heres-what-the-new-moon-on-march-13-means-for-your-zodiac-sign/l-intro-1615565866.jpg',
    'https://www.boltonvalley.com/wp-content/uploads/2021/06/buck-moon.jpg',
];

let i = 0;
for (let imageUrl of results.slice(0, 9)) {
    let div = new ModalImagePreviewElement();
    mainDOMElements.modal.imgGridContainer.appendChild(div.div);
    div.div.appendChild((new ImageExtended()).setSRC(imageUrl));
}

function startSearch(query) {
    (async () => {
        if (!query || query.replace(/\s/ig, '').length < 3) {
            alert('Search query must be three or more symbols! (whitespaces excluded)');
            return;
        }
        mainDOMElements.loaderScreen.style.display = 'block';
        let queryToDo = queryMap.setAndGet(query, WebQueryProvider);
        await queryToDo.getPageResults();
        fillImagesPreviewModal(queryToDo.resultObj.imgExtResultArr);
        mainDOMElements.loaderScreen.style.display = 'none';
        mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
    })();
}

function nextSearch() {
    (async () => {
        let queryToDo = queryMap.lastAccessed;
        if (queryToDo == null) return;
        mainDOMElements.loaderScreen.style.display = 'block';
        queryToDo.resultObj.navigate = 'next';
        await queryToDo.getPageResults(queryToDo.resultObj);
        fillImagesPreviewModal(queryToDo.resultObj.imgExtResultArr);
        mainDOMElements.loaderScreen.style.display = 'none';
        mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
    })();
}

function prevSearch() {
    (async () => {
        let queryToDo = queryMap.lastAccessed;
        if (queryToDo == null) return;
        mainDOMElements.loaderScreen.style.display = 'block';
        queryToDo.resultObj.navigate = 'previous';
        await queryToDo.getPageResults(queryToDo.resultObj);
        fillImagesPreviewModal(queryToDo.resultObj.imgExtResultArr);
        mainDOMElements.loaderScreen.style.display = 'none';
        mainDOMElements.modal.inputTextSearch.value = queryToDo.resultObj.query;
    })();
}

function fillImagesPreviewModal(resultsImgArr) {
    mainDOMElements.modal.imgGridContainer.innerHTML = '';

    for (let imgExt of resultsImgArr) {
        let div = new ModalImagePreviewElement();
        mainDOMElements.modal.imgGridContainer.appendChild(div.div);
        div.div.appendChild(imgExt);
    }
}