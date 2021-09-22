'use strict'

let modal = document.getElementById("modal");
let btn = document.getElementById("button");
let span = document.getElementById("buttonCloseModal");
let loader = document.getElementById("loading-container");
let btnOpenLoader = document.getElementById('buttonOpenLoader');

btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}

btnOpenLoader.onclick = function () {
    loader.style.display = 'block';
}

loader.onclick = function () {
    loader.style.display = 'none';
}