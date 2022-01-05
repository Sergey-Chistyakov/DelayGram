"use strict"
/*
all interactions with DB in classes only
todo check how committing selected images done, rewrite using galleriesManger
*/

//God object ------------------------------------------------------------------------------------------
let galleriesManager = {

	galleryInChangeMode: null,

	async initiate() {
		await this.getGalleriesFromIDB();
		await this.getImagesFromIDB();
		this.refreshGalleriesDomList();
		galleriesCollection.setAndGet(galleriesCollection.lastChanged.name);
		if (galleriesCollection.lastAccessed)
			this.showGallery(galleriesCollection.lastAccessed);
	},

	async getGalleriesFromIDB() {
		if ((await pidb.countAll({objStoreName: 'galleries'})) < 1)
			galleriesCollection.setAndGet("default", GalleryHandleObject, {
				name: "new gallery",
				icon: "collections",
				description: "Rename and fill",
				imageURLarr: [],
				createOrReplaceDBItem: true,
				changed: new Date(),
				created: new Date(),
			});

		let results = await pidb.getAllItems({objStoreName: 'galleries'});
		for (let gallery of results) {
			gallery.createOrReplaceDBItem = false;
			galleriesCollection.setAndGet(gallery.name, GalleryHandleObject, gallery);
		}

	},

	async getImagesFromIDB() {
		if ((await pidb.countAll({objStoreName: 'images'})) < 1) {
			console.log('EMPTY IDB IMAGES');
			return;
		}

		let results = await pidb.getAllItems({objStoreName: 'images'});
		for (let image of results) {
			image.createOrReplaceDBItem = false;
			imagesCollection.set(image.url, new ImageHandleObject(image));
		}

	},

	/**
	 * Adds images into specified gallery collection
	 * @param gallery String gallery name OR GalleryHandleObject
	 * @param imgElementsSet Set of Image DOM Elements
	 */
	addSelectedImgElements(gallery, imgElementsSet) {
		if (!gallery || !imgElementsSet || !(imgElementsSet instanceof Set)
			|| (typeof gallery !== 'string' && !(gallery instanceof GalleryHandleObject))
			|| !galleriesCollection.has(gallery?.name ?? gallery)) return;

		galleriesCollection.setAndGet(gallery?.name ?? gallery);
		for (let imageElement of imgElementsSet.values()) {
			galleriesCollection.lastAccessed.imageURLarr.push(imageElement.src);
			if (!imagesCollection.has(imageElement.src))
				imagesCollection.set(imageElement.src, new ImageHandleObject({
					url: imageElement.src,
					imageElement: imageElement,
				}));
		}
		galleriesCollection.lastAccessed.rewriteIDBItem();//todo move to constructor on image collection set
	},

	/**
	 * Fills main screen with gallery images
	 * @param gallery GalleryHandleObject
	 */
	showGallery(gallery) {
		if (!gallery?.name) return;
		let imageElementsCollection = galleriesCollection.setAndGet(gallery.name).imageElementsCollection;
		mainDOMElements.main.picContainer.innerHTML = "";
		if (!imageElementsCollection || imageElementsCollection.length < 1) return;
		for (let imageElement of imageElementsCollection) {
			mainDOMElements.main.picContainer.appendChild(imageElement);
		}
	},

	/**
	 *
	 * @param name {string} Name for new gallery
	 * @param icon {string} Google font icons name
	 * @param description {string} Some description
	 * @returns {boolean} "false" if gallery with such name exists, "true" if OK
	 */
	addNewGallery({name, icon, description} = {}) {
		if (!name) return false;
		if (galleriesCollection.has(name)) return false; // gallery with such name exists

		let newGallery = galleriesCollection.setAndGet(name, GalleryHandleObject, arguments[0]);
		this.refreshGalleriesDomList();
		this.showGallery(newGallery);
		return true;
	},

	refreshGalleriesDomList() {
		mainDOMElements.main.galleriesList.innerHTML = '';
		for (let galleryHandle of galleriesCollection.orderedByCreationDate) {
			let li = document.createElement('li');
			li.addEventListener('click', () => {
				this.showGallery.call(this, galleryHandle)
			});
			let span = document.createElement('span');
			span.innerHTML = galleryHandle.icon;
			li.appendChild(span);
			li.appendChild(document.createTextNode(galleryHandle.name));
			mainDOMElements.main.galleriesList.appendChild(li);
		}
	},
}

//Collections classes------------------------------------------------------------------------------------------
class GalleriesMap extends MapExtended {
	constructor() {
		super();
		// todo check if galleries table empty
	}

	// todo get keys collection form idb and set last existing as lastAccessed
	// todo check how lastAccessed is done
	get lastAccessed() {
		if (!super.lastAccessed) {
			this.setAndGet("default", GalleryHandleObject, {
				name: "new gallery",
				icon: "collections",
				description: "Rename and fill",
			});
		}

		return super.lastAccessed;
	}

	get lastChanged() {

		let lastChange = new Date(0);
		let newestGallery = null;
		this.forEach((value, key) => {
			if (value.changed > lastChange) {
				lastChange = value.changed;
				newestGallery = this.get(key);
			}
		});
		return newestGallery;
	}

	get orderedByCreationDate() {
		return Array.from(this.values()).sort(function(a,b) {
			return b.created - a.created;
		});
	}
}

class ImagesMap extends Map {
	constructor() {
		super();
	}
}

// DONE Elements classes ---------------------------------------------------------------------------------------
class GalleryHandleObject {
	constructor({
					name,
					icon = "help_center",
					description = "",
					created,
					imageURLarr = [],
				} = {}) {
		if (!name) throw new Error("Name is undefined or null");
		if (galleriesCollection.has(name))
			throw new Error("Gallery already exists");
		this.icon = icon;
		this.description = description;
		this.created = created ?? new Date();
		this.changed = new Date();
		this.name = name;
		this.imageURLarr = (Array.isArray(imageURLarr) && imageURLarr.length > 0) ? imageURLarr : [];

		this.rewriteIDBItem();
	}

	// todo save on image collection change
	// set imageURLarr(value) {
	//
	// }

	/**
	 * get collection of images from bounded imageHandlers
	 * @returns {null|*[HTMLImageElement]} returns array of image DOM elements or null if empty
	 */
	get imageElementsCollection() {
		if (this.imageURLarr.length < 1) return [];
		let result = [];
		this.imageURLarr.slice().reverse().forEach((url) => {
			if (imagesCollection.get(url)?.imageElement)
				result.push(imagesCollection.get(url).imageElement);
		});
		return result;
	}

	// rewrite this gallery in idb
	rewriteIDBItem() {
		this.changed = new Date();
		pidb.addItem({
			id: this.name,
			objStoreName: 'galleries',
			replaceExisting: true,
			object: Object.assign(new Object(), this)
		});
	}

	show() {
		galleriesManager.showGallery(this);
	}

}

//todo rewrite constructor must work with image object from idb
class ImageHandleObject {
	#image = null;
	url = null;

	constructor({
					url = null,
					imageElement = null,
					createOrReplaceDBItem = true,
				} = {}) {
		if (!url && !imageElement)
			throw new Error("Empty url and Image DOM element");

		this.url = imageElement?.src ?? url;
		if (!createOrReplaceDBItem) return;
		try {
			pidb.addItem({
				objStoreName: 'images',
				object: Object.assign(new Object(), this),
				replaceExisting: false,
			});
		} catch (err) {
			// todo ignore errors of existence of such item
			throw err;
		}
	}

	get imageElement() {
		if (!this.#image?.complete) {
			this.#image = new ImageExtended().setSRC(this.url);
			this.#image.setAttribute("loading", "lazy");
			this.#image.alt = "..pic/brokenimage.png";
		}
		return this.#image;
	}
}

// Global variables --------------------------------------------------------------------------------------------
let galleriesCollection = new GalleriesMap();
let imagesCollection = new ImagesMap();


// Executive part -----------------------------------------------------------------------------------------------
(async () => {
	await galleriesManager.initiate();
})();



