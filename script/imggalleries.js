"use strict"

let pidb = new PromisedIndexDB({
	dbName: 'dbGalleries',
	version: 1,
	upgradeNeededCallback: function (event) {
		let db = event.target.result;
		switch (db.version) {
			case 1:
				db.createObjectStore("images", {keyPath: 'id'})
					.createIndex("parentGallery", "parentGallery", {unique: false});
				db.createObjectStore('galleries', {keyPath: 'name'});
		}
	}
});

//------------------------------------------------------------------------------------------
class GalleriesMap extends MapExtended {
	constructor() {
		super();
		pidb.getAllItems({objStoreName: 'galleries'})
			.then((galleriesArr) => {
				for (let gallery of galleriesArr) {
					galleriesCollection.setAndGet(gallery.name, GalleryImagesSet, gallery);
				}
			}).then(() => {
			pidb.getAllItems({objStoreName: 'images'}).then((imagesArr) => {
					//todo check image belongs to what gallery
					for (let image of imagesArr) {
						galleriesCollection.lastAccessed.add(new ImageHandleObject({
							url: image.imageUrl,
							parentGallery: galleriesCollection.lastAccessed,
						}));
					}
				}
			).then(() => {
				showGallery(galleriesCollection.lastAccessed);
			});
		});
	}
}

//------------------------------------------------------------------------------------------
class GalleryImagesSet extends Set {
	constructor({
					name = null,
					icon = "help_center",
					description = "",
				} = {}) {
		if (!name) throw new Error("Name is undefined or null");
		if (galleriesCollection.has(name))
			throw new Error("Gallery already exists");
		super();
		this.icon = icon;
		this.description = description;
		this.created = new Date();
		this.changed = new Date();
		this.name = name;

		pidb.add({
			objStoreName: 'galleries',
			replaceExisting: true,
			object: Object.assign(new Object(), this),
		});

		objectMixIn(this);
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
let galleriesCollection = new GalleriesMap();
// galleriesCollection.setAndGet("default", GalleryImagesSet, {
// 	name: "default",
// 	icon: "bug_report",
// 	description: "Dummy gallery for tests",
// });

//------------------------------------------------------------------------------------------
class ImageHandleObject {
	#image = null; // It's possible that "#" will be able to passe into idb, one terrible day of my life
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
		if (!parentGallery)
			throw new Error('Argument |parentGallery| null or undefined');

		if (imageElement) {
			this.imageUrl = imageElement.src;
		} else this.imageUrl = url;
		this.created = created ?? new Date();
		this.position = position ?? parentGallery.getNextPosition();
		this.id = parentGallery.name + '@' + this.imageUrl;
		console.log(this);
		pidb.add({
			objStoreName: 'images',
			object: Object.assign(new Object(), this),
			replaceExisting: true,
		});
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
