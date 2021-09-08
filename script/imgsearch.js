'use strict'

const API_KEY = 'AIzaSyBs3BcTa5D_otlqYjNkGud9Lwp1ktTb5qE';
const CSE = 'e8e4c105a7c6c1f01';
const SEARCH_HTTP = 'https://customsearch.googleapis.com/customsearch/v1?';

// let queryParameters = {
//     cx: CSE,
//     safe: "active",         // Filter: no porn, violence etc
//     filter: "1",            // no Duplicate results filter
//     num: 10,                // Quantity of results from 1 to 10 only (((
//     imgSize: "LARGE",
//     imgType: "photo",
//     q: "",                  // Placeholder for query
//     searchType: "image",
//     key: API_KEY,
//     start: 0,               // Start result for query in
// };

let imageMap = new Map(); // Cache for images
let queryMap = new Map(); // Cache for queries

//------------------------------------------------------------------------------------------
class WebQueryProvider {
    #lastSearch = new Date(0);
    #searchHttp = '';
    #runs = false;
    results = [];

    #options = {
        cx: CSE,
        key: API_KEY,
        start: 0,               // Start result for query in
        num: 10,                // Quantity of results from 1 to 10 only (((
        q: "",                  // Placeholder for query
        safe: "active",         // Filter: no porn, violence etc
        filter: "1",            // "no Duplicate results" filter
        searchType: "image",
        imgType: "photo",
        imgSize: "LARGE",
    }

    set resultsQuantity(value) {
        if (!!value || isNaN(value)) this.#options.num = value;
        return this;
    }

    set startResultsNumber(value) {
        if (!!value || isNaN(value)) this.#options.start = value;
        return this;
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
        if (this.#runs || (new Date() - this.#lastSearch < 120000)) return;
        try {
            this.#establishQuery();
            this.#runs = true;
            let response = await fetch(this.#searchHttp);
            if (response.ok) {
                let json = await response.json();
                for (let responseItem of json.items) {
                    this.results.push(responseItem.link);
                }
                this.#lastSearch = new Date();
            } else {
                throw new Error("Ошибка HTTP: " + response.status);
            }
        } catch (e) {
            alert(e);
        } finally {
            this.#runs = false;
            return this;
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
class ImageExtended extends Image {
    setSRC(srcToSet) {
        this.src = srcToSet;
        return this;
    }
}

//------------------------------------------------------------------------------------------
(async () => {
    let query = 'French fries';
    query = query.trim();
    if (!queryMap.has(query)) queryMap.set(query, new WebQueryProvider(query));
    let queryToDo = queryMap.get(query);
    await queryToDo.commit();
    let results = queryToDo.results;

    if (results.length == 0) {
        alert('empty response');
        return;
    }

    let imgGridContainer = document.getElementById('pic-container-modal');

    for (let imageUrl of results) {
        let div = document.createElement('div');
        div.style.height = '24vh';
        div.appendChild((new ImageExtended()).setSRC(imageUrl));
        imgGridContainer.appendChild(div);
    }
})();

//------------------------------------------------------------------------------------------
function imgCashe(url) {
    if (imageMap.has(url)) return imageMap.get(url);

}