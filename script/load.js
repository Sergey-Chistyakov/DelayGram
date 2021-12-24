'use strict'

/**
 * Calls functions by order from 0 to 9999.
 * If some has same order calls all at once in Promise.all()
 * @param objArray [{name:String for errors, order:Num, exeFunc:Func for execution},...]
 * @returns {Promise<void>} async function returns promise by default
 */
async function syncronizedPromises(objArray) {
	if (!objArray || !Array.isArray(objArray) || !objArray.length) throw new Error('Argument is not Array / empty array');
	// get sorted functions
	let orderedElementsArrMap = new Map();
	for (let {order, exeFunc, name} of objArray) {
		if ((!order && order !== 0) || !exeFunc) throw  new Error(`Invalid argument |${name}|`);
		if (!orderedElementsArrMap.has(order)) orderedElementsArrMap.set(order, []);
		orderedElementsArrMap.get(order).push(exeFunc);
	}
	// call func by order
	for (let key of Array.from(orderedElementsArrMap.keys()).sort((a, b) => a - b)) {
		let elementsArr = orderedElementsArrMap.get(key);
		let promisesArr = [];
		for (let element of elementsArr) {
			promisesArr.push(new Promise(((resolve, reject) => element(resolve, reject))));
		}
		// todo catch errors in Promise.all
		await Promise.all(promisesArr);
	}
}

// loading js files via promises --------------------------------------------------------------------------------------
// todo search for info how to check if DOM element ready
let scriptArr = [];

let jsArr = [
	{name: 'script/common.js', order: 0, exeFunc: null},
	{name: 'script/promisedindexdb.js', order: 1, exeFunc: null},
	{name: 'script/imgsearch.js', order: 1, exeFunc: null},
	{name: 'script/globalvariables.js', order: 2, exeFunc: null},
	{name: 'script/pageinit.js', order: 3, exeFunc: null},
	{name: 'script/imggalleries.js', order: 4, exeFunc: null},
];

for (let jsFile of jsArr) {
	jsFile.exeFunc = (resolve, reject) => {
		let script = document.createElement('script');
		script.onload = resolve();
		script.onerror = reject();
		script.src = jsFile.name;
		setTimeout(()=>{document.head.appendChild(script);},0);
		// scriptArr.push(script);
	};
}

// let appendChildrenObj = {};
// appendChildrenObj.exeFunc = ()=>{document.head.append(...scriptArr);};
// appendChildrenObj.order = 66;
// appendChildrenObj.name = 'Appending Scripts object';
// jsArr.push(appendChildrenObj);

syncronizedPromises(jsArr);
