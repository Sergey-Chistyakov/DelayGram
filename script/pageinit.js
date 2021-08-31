'use strict'

let modal = document.getElementById("modal");
let btn = document.getElementById("button");
let span = document.getElementById("buttonCloseModal");

btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}


