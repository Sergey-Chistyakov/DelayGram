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
}

class MapExtended extends Map {
    getOrSet(value, TypeConstructor) {
        if (!this.has(value)) this.set(value, new TypeConstructor(value));
        return this.get(value);
    }
}

//------------------------------------------------------------------------------------------
let imageMap = new MapExtended(); // Cache for images
let queryMap = new MapExtended(); // Cache for queries

//------------------------------------------------------------------------------------------
class WebQueryProvider {
    #lastSearch = new Date(0);
    #searchHttp = '';
    #runs = false;
    #searchDelay = 120000;      // ms
    #totalResults = null;
    #resultRequestImageUrls = [];
    #shownImages = 0;
    #resultImages = new Map();

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

    set resultsQuantity(value) {
        if (!value && !isNaN(value) && value <= 10 && value > 0) this.#options.num = value;
        return this;
    }

    set startResultsNumber(value) {
        if (!value || !isNaN(value) && (this.#totalResults > 0) ? value <= this.#totalResults : true) this.#options.start = value;
        return this;
    }

    get #canSearchFurther() {
        return this.#totalResults == null || (this.#totalResults >= this.#options.start && this.#options.start + this.#options.num < 100);
    }

    get results() {
        return this.#resultRequestImageUrls;
    }

    resultsNext(numOfResults) {

    }

    constructor(query, start = 0, resultsQuantity = 10) {
        if (!query || query.replace(/\s/ig, '').length < 3) {
            alert('Search query must be more or three symbols!');
            return null;
        }

        this.#options.q = query;
        this.#options.start = (isNaN(start) || !!start) ? 0 : start;
        this.#options.num = (isNaN(resultsQuantity) || !!resultsQuantity) ? 10 : resultsQuantity;
    }


    async commit() {
        if (this.#runs || !this.#canSearchFurther || (Date.now() - this.#lastSearch < this.#searchDelay)) return;
        try {
            this.#establishQuery();
            this.#runs = true;
            let response = await fetch(this.#searchHttp);
            if (response.ok) {
                let json = await response.json();
                for (let responseItem of json.items) {
                    this.#resultRequestImageUrls.push(responseItem.link);
                }
                if (this.#resultRequestImageUrls.length == 0) {
                    throw new Error('EmptyResponse');
                }
                if (json.queries.nextPage.length == 1) { // !!!!!!!!!!!!! check if property exists
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

// (async () => {
//     let queryToDo = queryMap.getOrSet('Sun and moon', WebQueryProvider); // query goes here!!!!
//     await queryToDo.commit();
//     let results = queryToDo.results;
//
//     let imgGridContainer = document.getElementById('pic-container-modal');
//
//     for (let imageUrl of results.slice(0,9)) {
//         let div = document.createElement('div');
//         imgGridContainer.appendChild(div);
//         div.appendChild((new ImageExtended()).setSRC(imageUrl));
//         addControls(div, 'first');
//
//     }
// })();

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
let imgGridContainer = document.getElementById('pic-container-modal');
let i = 0;
for (let imageUrl of results.slice(0, 9)) {
    let div = document.createElement('div');
    imgGridContainer.appendChild(div);
    div.appendChild((new ImageExtended()).setSRC(imageUrl));
    addControls(div, (i++).toString());
}

//------------------------------------------------------------------------------------------
// todo replace true-false with error handling

function addControls(div, idToSet = null, imgToSet = null) {
    if (idToSet == null && div.id == undefined) return false;
    if (idToSet == null) idToSet = div.id;

    // Add mask for selected elements
    let divSelectionMark = document.createElement('div');
    divSelectionMark.className = 'selected';
    divSelectionMark.innerHTML = '&#xE92D';
    divSelectionMark.style.opacity = '0';
    divSelectionMark.id = idToSet + '-selectionMark';
    div.appendChild(divSelectionMark);

    // Add popup menu for selection and preview
    //todo preview lightbox of some kind
    let widthShown = '50%';
    let widthHide = '40%';
    let opacityShown = '0.8';
    let opacityHide = '0';

    let divPreview = document.createElement('div');
    divPreview.className = 'popup popup-top';
    divPreview.innerHTML = '&#xe8ff';
    divPreview.style.opacity = opacityHide;
    divPreview.style.width = widthHide;
    div.appendChild(divPreview);

    let divSelect = document.createElement('div');
    divSelect.className = 'popup popup-bottom';
    divSelect.innerHTML = '&#xe876';
    divSelect.style.opacity = opacityHide;
    divSelect.style.width = widthHide;
    divSelect.addEventListener('click', () => {
        if (Number.parseFloat(divSelectionMark.style.opacity) == 0 ) {
            divSelectionMark.style.opacity = '0.5';
            divSelect.innerHTML = '&#xe5cd';
        } else {
            divSelectionMark.style.opacity = '0';
            divSelect.innerHTML = '&#xe876';
        }
    });
    div.appendChild(divSelect);

    div.addEventListener('mouseover', () => {
        divPreview.style.opacity = opacityShown;
        divSelect.style.opacity = opacityShown;
        divPreview.style.width = widthShown;
        divSelect.style.width = widthShown;
    });

    div.addEventListener('mouseout', () => {
        divPreview.style.opacity = opacityHide;
        divSelect.style.opacity = opacityHide;
        divPreview.style.width = widthHide;
        divSelect.style.width = widthHide;
    });

    return true;
}