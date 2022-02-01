"use strict"

//God object ------------------------------------------------------------------------------------------
let galleriesManager = {

	/**
	 * Gets data from IDB, prepares DOM elements
	 * @returns {Promise<void>}
	 */
	async initiate() {
		await this.getGalleriesFromIDB();
		this.refreshGalleriesDomList();
		if (galleriesCollection.lastChanged) {
			galleriesCollection.setAndGet(galleriesCollection.lastChanged.name);
			this.showGallery(galleriesCollection.lastAccessed);
		}
	},

	/**
	 * Fills {@link galleriesCollection} and {@link imagesCollection}
	 * @returns {Promise<void>}
	 */
	async getGalleriesFromIDB() {
		if ((await pidb.countAll({objStoreName: 'galleries'})) < 1) return;

		let results = await pidb.getAllItems({objStoreName: 'galleries'});
		for (let gallery of results) {
			galleriesCollection.setAndGet(gallery.name, GalleryHandleObject, gallery);
			if (!gallery?.imageURLarr?.length || gallery.imageURLarr.length < 1)
				continue;
			for (let imageURL of gallery.imageURLarr)
				imagesCollection.set(imageURL, new ImageHandleObject({url: imageURL}));
		}
	},

	/**
	 * Adds images into specified gallery collection
	 * @param gallery {string||GalleryHandleObject} Gallery to add images to - Obligatory
	 * @param imgElementsSet {Set<HTMLImageElement>} DOM Image elements to add - Obligatory
	 * @return void
	 */
	addSelectedImgElements(gallery, imgElementsSet) {
		if (!gallery || !imgElementsSet || !(imgElementsSet instanceof Set)
			|| (typeof gallery !== 'string' && !(gallery instanceof GalleryHandleObject))
			|| !galleriesCollection.has(gallery?.name ?? gallery)) return;

		galleriesCollection.setAndGet(gallery?.name ?? gallery);
		galleriesCollection.lastAccessed.imageURLarr.push(...getPropValueArrFromEnum(imgElementsSet, 'src'));
		for (let imageElement of imgElementsSet.values()) {
			if (!imagesCollection.has(imageElement.src))
				imagesCollection.set(imageElement.src, new ImageHandleObject({
					url: imageElement.src,
					imageElement: imageElement,
				}));
		}
	},

	/**
	 * Fills main screen {@link mainDOMElements.main.picContainer} with gallery images
	 * @param gallery {GalleryHandleObject} Gallery to show
	 */
	showGallery(gallery) {
		if (!gallery?.name) return;
		let imageElementsCollection = galleriesCollection.setAndGet(gallery.name).imageElementsCollection;
		mainDOMElements.main.header.galleryName.innerHTML = galleriesCollection.lastAccessed.name;
		mainDOMElements.main.header.galleryDesc.innerHTML = galleriesCollection.lastAccessed.description.replaceAll('\n', '<br>');
		mainDOMElements.main.picContainer.scrollTop = 0;
		mainDOMElements.main.picContainer.innerHTML = "";
		if (!imageElementsCollection || imageElementsCollection.length < 1) return;
		for (let imageElement of imageElementsCollection) {
			mainDOMElements.main.picContainer.appendChild(imageElement);
			setDraggable(imageElement, 'src', null, DRAGDROP_TYPES.image);  //todo delete this
			setDropZone(imageElement, 'src', null, DRAGDROP_TYPES.image, ({dragKey, dropKey})=>{
				console.log(`drag \n${dragKey} \ndrop \n${dropKey}`);  //todo delete this
				if (dragKey !== dropKey)
					galleriesManager.changeImagePosition(dragKey, dropKey);
			});
		}
	},

	/**
	 * Create new gallery in galleriesCollection
	 * does not add anything in IDB. See ImageHandle
	 * @see {@link ImageHandleObject.constructor}
	 *
	 * @param name {string} Name for new gallery - Must be not null
	 */
	addNewGallery({name} = {}) {
		arguments[0].rewriteIDB = true;

		let newGallery = galleriesCollection.setAndGet(name, GalleryHandleObject, arguments[0]);
		this.refreshGalleriesDomList();
		this.showGallery(newGallery);
	},

	/**
	 * Refills {@link mainDOMElements.main.galleriesList} with galleries names and icons.
	 * Adds event listeners to show images on 'click'.
	 */
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
			setDraggable(li, null, galleryHandle.name, DRAGDROP_TYPES.gallery);
			setDropZone(li, null, galleryHandle.name, DRAGDROP_TYPES.image, ({dragKey, dropKey})=>{
				if (dropKey === galleriesCollection.lastAccessed.name)
					return;
				let gallery = galleriesCollection.lastAccessed;
				this.addSelectedImgElements(dropKey, new Set([imagesCollection.get(dragKey).imageElement]));
				this.deleteImageFromGallery(dragKey, gallery);

			});
			mainDOMElements.main.galleriesList.appendChild(li);
		}
	},

	/**
	 * Deletes image from selected gallery, IDB updated automatically,
	 * image deleted from {@link imagesCollection} if not used in other galleries.
	 * @see this.deleteImageIfNotUsed
	 * @param image{string||ImageHandleObject} - image URL or object for deletion
	 * @param gallery{string||GalleryHandleObject} - gallery name or object
	 * @return {boolean} - true if deleted successfully
	 */
	deleteImageFromGallery(image, gallery) {
		if (!image || !gallery) throw new Error('Empty arguments');
		if (
			!(image instanceof ImageHandleObject)
			&& (typeof image === 'string' && image.length < 1)
		) throw new Error(`image - must be String URL of image or instance of GalleryHandleObject`);
		if (
			!(gallery instanceof GalleryHandleObject)
			&& (typeof gallery === 'string' && gallery.length < 1)
		) throw new Error(`gallery - must be String name of gallery or instance of GalleryHandleObject`);

		if (!(gallery instanceof GalleryHandleObject)) {
			if (!galleriesCollection.has(gallery)) throw new Error(`gallery not found in galleriesCollection`);
			gallery = galleriesCollection.setAndGet(gallery);
		}

		if (image instanceof ImageHandleObject)
			image = image.url;

		if (gallery.imageURLarr.includes(image)) {
			gallery.imageURLarr.splice(gallery.imageURLarr.indexOf(image), 1);
			this.deleteImageIfNotUsed([image]);
			this.showGallery(gallery);
			return true;
		}
		return false;
	},

	/**
	 * Search for images from array if used in galleries, deletes them from {@link imagesCollection} if not found
	 * @param imagesURLarr {[string]} - imageURLarr to check if delete possible
	 * @return {Promise<void>}
	 */
	async deleteImageIfNotUsed(imagesURLarr = []) {
		if (!Array.isArray(imagesURLarr))
			throw new Error(`Invalid Arguments`);
		for (let imageURL of imagesURLarr) {
			if (Array.from(galleriesCollection.values()).some(gallery => gallery.imageURLarr.includes(imageURL)))
				continue;
			imagesCollection.delete(imageURL);
		}
	},

	/**
	 * Check if gallery exists, deletes it and refills DOM elements
	 * @param galleryName {string} - gallery name to delete
	 */
	deleteGallery(galleryName) {
		if (!galleriesCollection.has(galleryName))
			throw new Error(`Gallery name not found`);

		let gallery = galleriesCollection.get(galleryName);
		let keysArr = getPropValueArrFromEnum(galleriesCollection.orderedByCreationDate, 'name');
		let galleryIndex = keysArr.indexOf(gallery.name);

		if (galleriesCollection.lastAccessed === gallery) {
			if (keysArr.length === 1) {
				mainDOMElements.main.header.galleryName.innerHTML = '';
				mainDOMElements.main.header.galleryDesc.innerHTML = '';
				mainDOMElements.main.picContainer.innerHTML = '';
				return;
			}
			let nearest = (galleryIndex > 0) ? galleryIndex - 1 : galleryIndex + 1;
			this.showGallery(galleriesCollection.setAndGet(keysArr[nearest]));
		}

		galleriesCollection.delete(gallery.name);
		this.refreshGalleriesDomList();
		this.deleteImageIfNotUsed(gallery.imageURLarr);
	},

	/**
	 * Replaces images position in {@link GalleryHandleObject.imageURLarr} and refills Dom elements
	 * @param imgURLtoMove {string} - URL of image to move
	 * @param imgURLTarget {string} - URL of image for the 'moved' one to be placed infront
	 * @param gallery {GalleryHandleObject} - if empty {@link galleriesCollection.lastAccessed} is used
	 */
	changeImagePosition(imgURLtoMove, imgURLTarget, gallery) {
		if (!gallery || !(gallery instanceof GalleryHandleObject))
			gallery = galleriesCollection.lastAccessed;
		if (!imgURLTarget || !imgURLtoMove)
			throw new Error(`Invalid arguments`);
		if (!gallery.imageURLarr.includes(imgURLTarget) || !gallery.imageURLarr.includes(imgURLtoMove))
			throw new Error(`Images not found`);

		let urlArr = gallery.imageURLarr.self.slice().reverse();
		let moveIndex = urlArr.indexOf(imgURLtoMove);
		let targetPositionIndex = urlArr.indexOf(imgURLTarget);
		urlArr.splice(targetPositionIndex, 0, urlArr.splice(moveIndex, 1)[0]);

		gallery.imageURLarr.splice(0,gallery.imageURLarr.length, ...urlArr.reverse());
		galleriesCollection.lastAccessed.show();
	},
}

//Collections classes------------------------------------------------------------------------------------------
class GalleriesMap extends MapExtended {
	constructor() {
		super();
	}

	delete(key) {
		if (!this.has(key))
			return;
		this.get(key).preventIDBUpdate();
		super.delete(key);
		pidb.removeItem({objStoreName: 'galleries', id: key});
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
		return Array.from(this.values()).sort(function (a, b) {
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
					changed,
					imageURLarr = [],
					rewriteIDB = false,
				} = {}) {
		if (!name) throw new Error("Name is undefined or null");
		if (galleriesCollection.has(name))
			throw new Error("Gallery already exists");
		this.icon = icon;
		this.description = description;
		this.created = created ?? new Date();
		this.changed = changed ?? new Date();
		this.name = name;
		this.imageURLarr = (Array.isArray(imageURLarr) && imageURLarr.length > 0) ? imageURLarr : [];

		Object.defineProperty(this, 'rewriteIDBTimeout', {
			enumerable: false,
			writable: true,
		});
		Object.defineProperty(this, 'preventUpdate', {
			value: false,
			enumerable: false,
			writable: true,
		});
		Object.defineProperty(this, 'preventIDBUpdate', {
			value: function () {
				if (this.rewriteIDBTimeout) {
					clearTimeout(this.rewriteIDBTimeout);
					this.rewriteIDBTimeout = null;
				}
				this.preventUpdate = true;
			},
			enumerable: false,
			writable: false,
		});

		Object.defineProperty(this, 'imageURLarr', {
			value: new Proxy(this.imageURLarr, {
				set: (function (target, property, value, receiver) {
					if (this.rewriteIDBTimeout) {
						clearTimeout(this.rewriteIDBTimeout);
						this.rewriteIDBTimeout = null;
					}
					if (!this.preventUpdate)
						this.rewriteIDBTimeout = setTimeout(this.rewriteIDBItem.bind(this), 1000);

					return Reflect.set(...arguments);
				}).bind(this),

				get: function (target, property, receiver) {
					if (property === 'self') return target;
					return Reflect.get(...arguments);
				},
			}),
			enumerable: false,
		});

		if (rewriteIDB)
			this.rewriteIDBItem();
	}

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
			object: Object.assign(new Object(), this, {imageURLarr: this.imageURLarr.self}),
		});
	}

	show() {
		galleriesManager.showGallery(this);
	}

}

class ImageHandleObject {
	#image = null;
	url = null;
	#errorEventListenerBinded = (function () {
		this.#image.removeEventListener('error', this.#errorEventListenerBinded);
		this.#image.src = "pic/brokenimage.png";
	}).bind(this);

	constructor({
					url = null,
					imageElement = null,
				} = {}) {
		if (!url && !imageElement)
			throw new Error("Empty URL and Image DOM element");
		this.url = imageElement?.src ?? url;
	}

	get imageElement() {
		if (!this.#image?.complete) {
			this.#image = new ImageExtended();
			this.#image.setAttribute("loading", "lazy");
			this.#image.setSRC(this.url);
			this.#image.addEventListener('error', this.#errorEventListenerBinded);
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