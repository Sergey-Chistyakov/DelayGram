//------------------------------------------------------------------------------------------

class ImageExtended extends Image {
	setSRC(srcToSet) {
		this.src = srcToSet;
		this.alt = '';
		return this;
	}

	#filterNotAllowed = ['https://static.wikia.nocookie.net', '.gif'];

	getPromise(srcToSet = null, mapToCheck = null) {
		let promise = new Promise(((resolve, reject) => {

			let setToMap = function (item) {
				if (mapToCheck != null) {
					mapToCheck.set(srcToSet, item);
				}
				return item;
			}

			if (srcToSet == null) {
				reject(new Error('No image URL'));
			}
			this.#filterNotAllowed.forEach((notAllowedString) => {
				if (srcToSet.includes(notAllowedString))
					reject(setToMap(new Error(`Forbidden by filter\n${srcToSet}`)));
			});

			if (mapToCheck != null && mapToCheck.has(srcToSet)) {
				if (mapToCheck.get(srcToSet) instanceof Error) {
					let err = new Error(`Cached error\n${srcToSet}`)
					err.cause = mapToCheck.get(srcToSet);
					reject(setToMap(err));
				}
				if (mapToCheck.get(srcToSet).complete)
					resolve(mapToCheck.get(srcToSet));
			}
			this.onload = () => {
				resolve(setToMap(this));
			};
			this.onerror = () => {
				reject(setToMap(new Error(`Failed to load image\n${srcToSet}`)));
			};
			this.src = srcToSet;
		}));
		return promise;
	}
}

class MapExtended extends Map {
	#lastAcc = null;

	constructor() {
		super();
	}

	get lastAccessed() {
		if (!Array.from(this.values()).includes(this.#lastAcc)) this.#lastAcc = null;
		return this.#lastAcc;
	}

	// todo some fills for standart methods using super.--- with lastAccessed set

	setAndGet(key, TypeConstructor, argsForConstructor) {
		if (!this.has(key)) {
			let value;
			if (argsForConstructor === undefined) value = new TypeConstructor(key);
			if (argsForConstructor === null) value = new TypeConstructor();
			if (argsForConstructor) value = new TypeConstructor(argsForConstructor);
			this.set(key, value);
			if ('lifeTime' in value) setTimeout(() => {
				if (this.has(key)) this.delete(key);
			}, value.lifeTime);
		}
		this.#lastAcc = this.get(key);
		return this.lastAccessed;
	}
}

/**
 * You can use [1] for arrays as "obj.array.1.prop" everything that can be placed in "[]".
 * @param iterableCollection collection of objects
 * @param propertyPath String
 * @returns {*[]} Array of properties values
 */
function getPropValueArrFromEnum(iterableCollection, propertyPath) {
	if (!iterableCollection || !propertyPath
		|| typeof iterableCollection[Symbol.iterator] !== 'function'
		|| !(typeof propertyPath === 'string' || propertyPath instanceof String)
		|| propertyPath.length < 1)
		return;

	function recursivePropGetter(pathArr, object, step = 0) {
		if (pathArr.length > step + 1) {
			return recursivePropGetter(pathArr, object[pathArr[step]], step + 1);
		}
		return object[pathArr[step]];
	}

	let propValues = [];
	for (let obj of iterableCollection) {
		if (obj)
			propValues.push(recursivePropGetter(propertyPath.split('.'),obj));
	}
	return propValues;
}

function domElementMixIn(objForMixIn) {
	if (!objForMixIn instanceof Element) return null;
	if ('mixedinDOM' in objForMixIn) return objForMixIn;

	Object.defineProperties(objForMixIn, {

		'setPropertiesValues': {
			value: function (propertiesObj = {}) {
				if (Object.keys(propertiesObj).length < 1) return this;
				for (let key in propertiesObj) {
					try {
						if (typeof propertiesObj[key] === 'object' && propertiesObj[key] !== null) {
							if (key == 'attributesToSet') this.setCustomAttributes(propertiesObj[key]);
							else {
								if (!(key in this)) this[key] = {};
								this.setPropertiesValues.call(this[key], propertiesObj[key]);
							}
						} else this[key] = propertiesObj[key];
					} catch (err) {
						console.log(err);
					}
				}
				return this;
			}
		},

		'addChild': {
			value: function (child) {
				if (!child.hasOwnProperty('addChild')) domElementMixIn(child);
				this.appendChild(child);
				return this;
			}
		},

		'setCustomAttributes': {
			value: function (customAttrObj) {
				for (let [key, value] of Object.entries(customAttrObj)) this.setAttribute(key, value);
			},
		},

		'activated': {
			set: function (activeAttrStatus) {
				this.setAttribute('active', activeAttrStatus.toString());
			},
		},

		'mixedinDOM': {
			value: true,
		},
	});

	return objForMixIn;
}

function objectMixIn(objForMixIn) {

	if ('mixedinObject' in objForMixIn) return objForMixIn;

	Object.defineProperties(objForMixIn, {

		'setPropertiesValues': {
			value: function (propertiesObj = {}) {
				if (Object.keys(propertiesObj).length < 1) return this;
				for (let key in propertiesObj) {
					try {
						if (typeof propertiesObj[key] === 'object' && propertiesObj[key] !== null) {
							if (!(key in this)) this[key] = {};
							this.setPropertiesValues.call(this[key], propertiesObj[key]);
						} else this[key] = propertiesObj[key];
					} catch (err) {
						console.log(err);
					}
				}
				return this;
			}
		},

		'addCustomEventListener': {
			value: function (eventName, callbackFunc) {
				if (!eventName || eventName.replace(/\s/ig, '').length < 1) return;
				if (!(`on_${eventName}` in this)) {
					this[`on_${eventName}`] = new Set();
				}
				this[`on_${eventName}`].add(callbackFunc);
			}
		},

		'removeCustomEventListener': {
			value: function (eventName, callbackFunc) {
				if (!eventName || eventName.replace(/\s/ig, '').length < 1 || !(`on_${eventName}` in this)) return;
				this[`on_${eventName}`].delete(callbackFunc);
			}
		},

		'dispatchCustomEvent': {
			value: function (eventName) {
				if (!eventName || eventName.replace(/\s/ig, '').length < 1 || !(`on_${eventName}` in this)) return;
				this[`on_${eventName}`].forEach((callbackFunc) => {
					callbackFunc();
				});
			}
		},

		'removeAllCustomEvent': {
			value: function (eventName) {
				if (!eventName || eventName.replace(/\s/ig, '').length < 1 || !(`on_${eventName}` in this)) return;
				this[`on_${eventName}`] = new Set();
			}
		},

		'checkCustomEventListner': {
			value: function (eventName) {
				if (!eventName || eventName.replace(/\s/ig, '').length < 1 || !(`on_${eventName}` in this)) return;
				return this[`on_${eventName}`].has(eventName);
			}
		},

		'mixedinObj': {
			value: true,
		},
	});
	return objForMixIn;
}

function getCallerFunctionName() {
	return new Error('dummy').stack.match(/at (\S+)/g)[1].slice(3);
}




