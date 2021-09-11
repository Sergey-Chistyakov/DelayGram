'use strict'

const API_KEY = 'AIzaSyBs3BcTa5D_otlqYjNkGud9Lwp1ktTb5qE';
const CSE = 'e8e4c105a7c6c1f01';
const SEARCH_HTTP = 'https://customsearch.googleapis.com/customsearch/v1?';

//------------------------------------------------------------------------------------------
class ImageExtended extends Image {
    setSRC(srcToSet) {
        this.src = srcToSet;
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

    // get #startResultsNumber() {
    //     return this.#options.start;
    // }

    get #canSearchFurther() {
        return this.#totalResults == null || (this.#totalResults >= this.#options.start  && this.#options.start + this.#options.num < 100);
    }

    get results() {
        return this.#resultRequestImageUrls;
    }

    resultsNext (numOfResults) {

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


//------------------------------------------------------------------------------------------
// TEST MAIN EXECUTABLE FUNCTION
(async () => {
    let queryToDo = queryMap.getOrSet('Something you wil 34556666 no onde for ytou !!!', WebQueryProvider); // query goes here!!!!
    // let results = await queryToDo.commit().results;
    // if (confirm('next?')) queryToDo.startResultsNumber = 11;
    await queryToDo.commit();
    let results = queryToDo.results;

    let imgGridContainer = document.getElementById('pic-container-modal');

    for (let imageUrl of results) {
        let div = document.createElement('div');
        div.style.height = '24vh';
        div.appendChild((new ImageExtended()).setSRC(imageUrl));
        imgGridContainer.appendChild(div);
    }
})();

//------------------------------------------------------------------------------------------
function imgCashe(urlArray) {


}