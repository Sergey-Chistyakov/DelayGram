'use strict'

//------------------------------------------------------------------------------------------
class GalleriesCollection extends MapExtended {
    constructor(jsonObject) {
        super();
        // create from json object from cookies
    }
}

//------------------------------------------------------------------------------------------
class GallerySet extends Set {
    constructor({nameToSet = null, icon = 'help_center', description = ''} = {}) {
        if (!nameToSet) throw new Error('Name is undefined or null');
        if (`gallery_${nameToSet}` in galleriesCollection) throw new Error('Gallery already exists');
        super();
        objectMixIn(this);
        this.icon = icon;
        this.desc = description;
        this.created = new Date();
        galleriesCollection.set(nameToSet, this);
    }

    addImages(imageCollection) {
        imageCollection.forEach(img => {
            try {
                this.add(new ImageHandleObject({imageElement: img, parentGallery: this}));
            } catch (e) {
                console.log(`${e}\n${img.src}`);
            }
        });
    }

    addURL(urlCollection) {

    }

    getNextPosition() {
        let positionArray = Array.from(this).map(value => value.position);
        positionArray.push(0);
        return Math.max(...positionArray) + 1;
    }
}

//--Main Map with galleries-----------------------------------------------------------------
let galleriesCollection = new GalleriesCollection();
galleriesCollection.setAndGet('default', GallerySet, {
    nameToSet: 'default',
    icon: 'bug_report',
    description: 'Dummy gallery for tests'
});

//------------------------------------------------------------------------------------------
class ImageHandleObject {
    #image = null;

    constructor({
                    url = null,
                    imageElement = null,
                    created = null,
                    position = null,
                    parentGallery = null,
                } = {}) {

        if (!url && !imageElement) throw new Error('Empty url and Image DOM element');
        this.imageUrl = url;
        if (imageElement) {
            this.#image = imageElement;
            this.imageUrl = imageElement.src;
        }
        this.created = created ?? new Date();
        this.position = position ?? (parentGallery) ? parentGallery.getNextPosition() : null;
    }

    get imageElement() {
        if (this.#image?.complete) return this.#image;
        else {
            this.#image = new ImageExtended();
            this.#image.setAttribute('loading', 'lazy');
            this.#image.alt = 'pic/brokenimage.png';
        }
    }
}

//------------------------------------------------------------------------------------------
// todo not perfect, rewrite
function showGallery(gallery) {
    if (!gallery) return;
    mainDOMElements.main.picContainer.innerHTML = '';
    gallery.forEach(imgHandle => {
        let div = document.createElement('div');
        div.appendChild(imgHandle.imageElement);
        mainDOMElements.main.picContainer.appendChild(div);
    });
}