
let results = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Supermoon_Nov-14-2016-minneapolis.jpg/1200px-Supermoon_Nov-14-2016-minneapolis.jpg',
    'https://phantom-marca.unidadeditorial.es/d3c076d28d2768328f83c297d722ddcb/crop/268x219/1257x776/f/jpg/assets/multimedia/imagenes/2021/07/23/16270444581760.jpg',
    'https://www.refinery29.com/images/10279335.jpg',
    'https://upload.wikimedia.org/wikipedia/ru/a/ad/Heartbreak_on_a_Full_Moon.jpg',
    'https://cdn1.ozone.ru/s3/multimedia-z/c1200/6058507955.jpg',
    'https://c.tadst.com/gfx/600x337/full-moon-phase.png?1',
    'https://www.popsci.com/uploads/2021/07/22/full-moon-griffin-wooldridge.jpg',
    'https://www.thelist.com/img/gallery/heres-what-the-new-moon-on-march-13-means-for-your-zodiac-sign/l-intro-1615565866.jpg',
    'https://www.boltonvalley.com/wp-content/uploads/2021/06/buck-moon.jpg',
];

for (let imageUrl of results) {
    let div = new ModalImagePreviewElement();
    mainDOMElements.modal.imgGridContainer.appendChild(div.div);
    div.div.appendChild((new ImageExtended()).setSRC(imageUrl));
}