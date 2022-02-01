'use strict'

/**
 * General description of used dataset attributes and it's values
 * item.dataset.dragdropKey - Identifier of element
 * item.dataset.dragdropDragEffect - For dataTransfer.effectAllowed
 * item.dataset.dragdropDropEffect - For dataTransfer.dropEffect
 * item.dataset.dragdropDroppableStyle {true||false} - For setting style via CSS for areas witch allows drop
 * item.dataset.dragdropDragTarget - For setting type of dragging element e.g. 'imgItem', 'menuItem'
 * item.dataset.dragdropDropTarget - For setting possible items to drop (several separated by '-' e.g. 'imgItem-menuItem')
 */

// Drag-Drop event handler general ---------------------------------------------------------------------------------------

const DRAG_ATT = {
	key: 'dragdropKey',
	typeOfDragElement: 'dragdropDragType',
	effect: 'dragdropDragEffect',
};

const DROP_ATT = {
	key: 'dragdropKey',
	allowedForDropTypes: 'dragdropDropType',
	effect: 'dragdropDropEffect',
};

const DRAGDROP_TYPES = {
	image: 'image_item',
	gallery: 'gallery_item',

	checkAvailableType: function (element, typesArray) {
		if (typesArray && !Array.isArray(typesArray))
			typesArray = [typesArray];
		let datasetElement = element.dataset[DROP_ATT.allowedForDropTypes];
		let confirmedTypesSet = new Set();
		if (datasetElement?.length)
			confirmedTypesSet = new Set(datasetElement?.split('-'));

		for (let type of typesArray) {
			if (!Object.values(this).includes(type))
				throw new Error(`Invalid drag/drop type`);
			confirmedTypesSet.add(type);
		}

		return Array.from(confirmedTypesSet).join('-');
	},
}

let dragdropCallbacks = {

	// todo rewrite for [allowedType]
	setCallback(allowedType, dropZoneKey, callback) {
		if (!Object.values(DRAGDROP_TYPES).includes(allowedType))
			throw new Error(`Invalid drag/drop type`);
		Object.values(DRAGDROP_TYPES).forEach(value => {
			if (value === allowedType) {
				if (!this[value])
					this[value] = {};
				this[value][dropZoneKey] = callback;
			}
		});
	},
};

function fillDataTransfer(event) {
	event.dataTransfer.setData('text/key', event.target.dataset[DRAG_ATT.key]);
	event.dataTransfer.setData(`type/${event.target.dataset[DRAG_ATT.typeOfDragElement]}`, 'true');
	event.dataTransfer.effectAllowed = event.target.dataset[DRAG_ATT.effect];
}

function canDropHere(event) {
	return event.target.dataset[DROP_ATT.allowedForDropTypes].split('-').some(value => {
			return event.dataTransfer.types.includes('type/' + value);
		}) && event.target.dataset[DROP_ATT.effect] === event.dataTransfer.effectAllowed
		&& event.dataTransfer.types.includes('text/key');
}

function dragStartEventHandlerGeneral(event) {
	fillDataTransfer(event);
	mainDOMElements.main.delete.container.style.display = 'block';
}

function dragEnterEventHandlerGeneral(event) {
	if (!canDropHere(event))
		return;
	event.target.dataset.dragdropDroppableStyle = 'true';
	event.preventDefault();
}

function dragOverEventHandlerGeneral(event) {
	if (!canDropHere(event))
		return;
	event.preventDefault();
}

function dragLeaveEventHandlerGeneral(event) {
	event.dataTransfer.dropEffect = 'none';
	event.target.dataset.dragdropDroppableStyle = 'false';
}

function dropEventHandlerGeneral(event) {
	if (!canDropHere(event) || !event.dataTransfer.getData('text/key')) {
		event.dataTransfer.dropEffect = 'none';
		return;
	}
	event.preventDefault();
	event.target.dataset.dragdropDroppableStyle = 'false';

	let type = event.dataTransfer.types.find(element => element.split('/')[0] === 'type').split('/')[1];
	let dropKey = event.target.dataset[DROP_ATT.key];

	if (dragdropCallbacks[type]?.[dropKey]) {
		dragdropCallbacks[type][dropKey]({dragKey: event.dataTransfer.getData('text/key'), dropKey: dropKey});
	}
}

function dragEndEventHandlerGeneral(event) {
	mainDOMElements.main.delete.container.style.display = 'none';
	if (event.dataTransfer.dropEffect === 'none') return;
}


// Setup functions ---------------------------------------------------------------------------------------

/**
 * Sets attributes and event handlers to provide Drop operations
 * @param element{HTMLElement} - element to be set as dropzone
 * @param pathToKey{string} - optional, used if 'key' not passed, see {@link getPropValueArrFromEnum}
 * @param key{string} - optional, used as identifier for element during DragDrop
 * @param allowedForDropTypes{string||[string]} - used to check if Drop can handle this element
 * @param callback{Function} - callback to run on allowed drop
 * */
function setDropZone(element, pathToKey, key, allowedForDropTypes, callback) {
	element.addEventListener('dragenter', dragEnterEventHandlerGeneral);
	element.addEventListener('dragover', dragOverEventHandlerGeneral);
	element.addEventListener('dragleave', dragLeaveEventHandlerGeneral);
	element.addEventListener('drop', dropEventHandlerGeneral);

	element.dataset[DROP_ATT.key] = key ?? getPropValueArrFromEnum([element], pathToKey)[0];
	element.dataset[DROP_ATT.effect] = 'move';
	element.dataset[DROP_ATT.allowedForDropTypes] = DRAGDROP_TYPES.checkAvailableType(element, allowedForDropTypes);

	dragdropCallbacks.setCallback(allowedForDropTypes, element.dataset[DROP_ATT.key], callback);
}

/**
 * Sets attributes and event handlers to provide Drag operations
 * @param element{HTMLElement} - element to be set as draggable
 * @param pathToKey{String} - optional, used if 'key' not passed, see {@link getPropValueArrFromEnum}
 * @param key{String} - optional, used as identifier for element during DragDrop
 * @param target{String} - used to check if Drop can handle this element
 */
function setDraggable(element, pathToKey, key, target) {
	element.addEventListener('dragstart', dragStartEventHandlerGeneral);
	element.addEventListener('dragend', dragEndEventHandlerGeneral);

	element.dataset[DRAG_ATT.key] = key ?? getPropValueArrFromEnum([element], pathToKey)[0];
	element.dataset[DRAG_ATT.typeOfDragElement] = target ?? '';
	element.dataset[DRAG_ATT.effect] = 'move';
	element.setAttribute('draggable', 'true');
}

// executable ---------------------------------------------------------------------------------------

setDropZone(mainDOMElements.main.delete.zone, null, 'delete_drop_zone', DRAGDROP_TYPES.image, function ({dragKey} = {}) {
	galleriesManager.deleteImageFromGallery(dragKey, galleriesCollection.lastAccessed);
});

setDropZone(mainDOMElements.main.delete.zone, null, 'delete_drop_zone', DRAGDROP_TYPES.gallery, function ({dragKey} = {}) {
	galleriesManager.deleteGallery(dragKey);
});

setDropZone(mainDOMElements.main.header.container, null, 'head', DRAGDROP_TYPES.image, function () {
});
setDropZone(mainDOMElements.main.header.container, null, 'head', DRAGDROP_TYPES.gallery, function () {
});
