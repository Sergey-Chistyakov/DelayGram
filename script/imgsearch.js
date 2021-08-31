'use strict'

const API_KEY = 'AIzaSyBs3BcTa5D_otlqYjNkGud9Lwp1ktTb5qE';
const CSE = 'e8e4c105a7c6c1f01';


// 'GET https://customsearch.googleapis.com/customsearch/v1?cx=e8e4c105a7c6c1f01&imgSize=LARGE&imgType=photo&q=human&searchType=image&key=[YOUR_API_KEY] HTTP/1.1\n' +
// '\n' +
// 'Accept: application/json\n'

let queryParameters = {
    cx: CSE,
    imgSize: "LARGE",
    imgType: "photo",
    q: "",
    searchType: "image",
    key: API_KEY,
};

function establishQuery(query) {
    if (!query || query.replace(/\s/ig, '').length < 3) {
        alert('Search query must be more or three symbols!');
        return;
    }

    let result = 'https://customsearch.googleapis.com/customsearch/v1?';
    for (let [key, value] of Object.entries(queryParameters)) {
        result += key + '=' + ((key == 'q') ? query.trim().replace(/\s/ig, '+') : value) + '&';
    }
    return result.slice(0, -1);
}

(async ()=> {
    let response = await fetch(establishQuery('Finland landscape'));
    if (response.ok) {
        let json = await response.json();
        let divForImg = document.getElementById('pic-container-modal');

        for(let i = 0; i<9; i++) {
            let div = document.createElement('div');
            div.style.height = '200px';
            div.style.backgroundImage = `url(${json.items[i].link})`;
            divForImg.appendChild(div);
        }
    } else {
        alert("Ошибка HTTP: " + response.status);
    }
})();

