"use strict";

//------------------------------------------------------------------------------------------
class GalleriesCollection extends MapExtended {
    constructor(jsonObject) {
        super();
        // create from json object from cookies
    }
}

//------------------------------------------------------------------------------------------
class GallerySet extends Set {
    constructor({
                    nameToSet = null,
                    icon = "help_center",
                    description = "",
                } = {}) {
        if (!nameToSet) throw new Error("Name is undefined or null");
        if (`gallery_${nameToSet}` in galleriesCollection)
            throw new Error("Gallery already exists");
        super();
        objectMixIn(this);
        this.icon = icon;
        this.desc = description;
        this.created = new Date();
    }

    addImages(imageCollection) {
        if (!imageCollection) return;
        imageCollection.forEach((img) => {
            try {
                this.add(
                    new ImageHandleObject({imageElement: img, parentGallery: this})
                );
            } catch (e) {
                console.log(`${e}\n${img.src}`);
            }
        });
    }

    addURL(urlCollection) {
        if (!urlCollection) return;
        urlCollection.forEach((imageURL) => {
            try {
                this.add(new ImageHandleObject({url: imageURL, parentGallery: this}));
            } catch (e) {
                console.log(`${e}\n${img.src}`);
            }
        });
    }

    getNextPosition() {
        let positionArray = Array.from(this).map((value) => value.position);
        positionArray.push(0);
        return Math.max(...positionArray) + 1;
    }
}

//--Main Map with galleries-----------------------------------------------------------------
let galleriesCollection = new GalleriesCollection();
galleriesCollection.setAndGet("default", GallerySet, {
    nameToSet: "default",
    icon: "bug_report",
    description: "Dummy gallery for tests",
});

//------------------------------------------------------------------------------------------
class ImageHandleObject {
    #image = null;
    imageUrl = null;

    constructor({
                    url = null,
                    imageElement = null,
                    created = null,
                    position = null,
                    parentGallery = null,
                } = {}) {
        if (!url && !imageElement)
            throw new Error("Empty url and Image DOM element");

        if (imageElement) {
            this.imageUrl = imageElement.src;
        } else this.imageUrl = url;
        this.created = created ?? new Date();
        this.position =
            position ?? parentGallery ? parentGallery.getNextPosition() : null;
    }

    get imageElement() {
        if (!this.#image?.complete) {
            this.#image = new ImageExtended().setSRC(this.imageUrl);
            this.#image.setAttribute("loading", "lazy");
            this.#image.alt = "..pic/brokenimage.png";
        }
        return this.#image;
    }
}

//------------------------------------------------------------------------------------------
// todo not perfect, rewrite
function showGallery(gallery) {
    if (!gallery) return;
    mainDOMElements.main.picContainer.innerHTML = "";
    gallery.forEach((imgHandle) => {
        // let div = document.createElement('div');
        // div.appendChild(imgHandle.imageElement);
        // mainDOMElements.main.picContainer.appendChild(div);
        mainDOMElements.main.picContainer.appendChild(imgHandle.imageElement);
    });
}
