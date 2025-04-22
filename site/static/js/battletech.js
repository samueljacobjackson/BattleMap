const ScreenWidthInches = 27.375 //Development
const resolutionWidth = 2560 //Development
const PPI = resolutionWidth / ScreenWidthInches;
const MiniatureBase = 1.375; //Size of battletech base in inches
const R = (MiniatureBase * PPI) / 2;  //Radius of what should the hex on screen in pixels (1.375 * Pixels per inch / 2)

let scale = 1; /* Scale of the map, 1 = 100% */
let map = null; /* Map object to hold map data  */
let drag = false;
let drawing = false; /* Flag to indicate if we are drawing a line */
let startHex = { q: 0, r: 0 }; /* Start hex for the line */

/* Initialize the stage using Konva.js */
const stage = new Konva.Stage({
    container: 'canvas',
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: false,
    x: 0,
    y: 0
});

/* Create a Konva layer to fit the map to the screen */
const mapLayer = new Konva.Layer({
    listening: false
});
stage.add(mapLayer);

const lineLayer = new Konva.Layer(); /* Create a layer for the line */
stage.add(lineLayer);
let line

const tooltipLayer = new Konva.Layer({
    listening: false
});
stage.add(tooltipLayer);

const label = new Konva.Label({
    x: 0,
    y: 0,
    opacity: 0.0,
});

// Create tooltip
const tooltipText = new Konva.Text({
    text: '',
    fontFamily: 'Calibri',
    fontSize: 16,
    padding: 5,
    fill: 'rgba(0,0,0,1)',
    listening: false,
});

const tooltip = new Konva.Group({
    listening: false,
});
const tooltipRect = new Konva.Rect({
    fill: 'white',
    opacity: 0.75,
    cornerRadius: 5,
});
tooltip.add(tooltipRect);
tooltip.add(tooltipText);
tooltipLayer.add(tooltip);

function moveTooltip(text, pos) {
    tooltip.x(pos.x - 10);
    tooltip.y(pos.y - 15);
    tooltipText.text(text);
    tooltipRect.width(tooltipText.width());
    tooltipRect.height(tooltipText.height());   
}

/* When mouse button iss released, we want to stop drawing the line */
function destroyLines() {
    lineLayer.destroyChildren(); /* Clear the line layer after mouseup */
    tooltip.hide(); /* Hide the tooltip when stopping to draw the line */
    drawing = false; /* Stop drawing the line */
}

/* Draw a blue line from origin to cursor position */
function drawLine(pos) {
    if (map === null) /* If no map is loaded, we can't draw a line */
        return;
    if (!drawing)
        return;
    if (!line)
        return;
    const points = line.points().slice();
    points[2] = pos.x;
    points[3] = pos.y;
    line.points(points);
    const hex = toAxial(pos); /* Get the hex for the line */
    const distance = axialDistance(startHex, hex); /* Get the distance between the start and end hexes */
    const text = `${distance}`; /* Create the text for the distance */
    moveTooltip(text, pos); /* Display the tooltip with the distance */
}

/* Initialize the line when starting to draw it */
function initLine(pos) {
    if (map === null) /* If no map is loaded, we can't draw a line */
        return;
    drawing = true; /* Set drawing to true when initializing the line */
    line = new Konva.Line({
        stroke: 'blue',
        strokeWidth: 3,
        listening: false,
        points: [pos.x, pos.y, pos.x, pos.y]
    });
    lineLayer.add(line);
    startHex = toAxial(pos); /* Get the start hex for the line */
    moveTooltip('0', pos); /* Display the tooltip with the start hex */
    tooltip.show(); /* Show the tooltip when starting to draw the line */
}

/* Hide the context menu when left clicking off it */
function hideContextMenu() {
    $(".accordion-collapse").removeClass("show"); /* Close any open accordions */
    $('#collapseMenu').collapse('hide');
}

/* Keep the context menu on screen if it goes out of bounds */
function keepContextMenuOnScreen(x, y, w, h) {
    if (y + h > window.innerHeight) {
        y = window.innerHeight - h;
    }
    if (x + w > window.innerWidth) {
        x = window.innerWidth - w;
    }
    if (y < 0) {
        y = 0;
    }
    if (x < 0) {
        x = 0;
    }
    $('#collapseMenu').css({ top: y, left: x, position: 'absolute' });
}

/* Load the map image and add it to the mapLayer */
function loadMap() {
    mapLayer.destroyChildren(); /* Clear the map layer before loading a new map */
    scale = R / map.R;
    const mapObj = new Image();
    mapObj.onload = function () {
        const mapImg = new Konva.Image({
            image: mapObj,
            scaleX: scale,
            scaleY: scale,
        });
        mapImg.x((stage.width() - (mapObj.width * scale)) / 2);
        mapImg.y((stage.height() - (mapObj.height * scale)) / 2);
        mapLayer.add(mapImg);
    };
    mapObj.src = map.src;
}

/* Show the context menu at the specified coordinates when right clicking stage */
function showContextMenu(x, y) {
    $("#collapseMenu").css({ top: y, left: x, position: 'absolute' });
    $('#collapseMenu').collapse('show');
}

/* Change the splashscreen image every 60 seconds */
function setSplashscreen(index) {
    if (map !== null) /* If no map is loaded, we can show the splashscreen */
        return;
    if (index > 14) { /* If we have shown all the images, start over */
        index = 0;
    }
    const mapObj = new Image();
    mapObj.onload = function () {
        const mapImg = new Konva.Image({
            image: mapObj,
            height: stage.height(),
            width: stage.width()
        });
        mapLayer.destroyChildren(); /* Clear the map layer before loading a new image */
        mapLayer.add(mapImg);
    };
    mapObj.src = `/static/img/battletech/splashscreen_${index}.jpg`; /* Load the next splashscreen image */
    setTimeout(function () {
        index++;
        setSplashscreen(index); /* Call this function again for the next image */
    }, 60000)
}

/* Initialize the screen and start spalshscreen rotation */
function start() {
    setSplashscreen(0); /* Start the splashscreen */
}

/* Event Handlers ******************************************/

/* Open the custiom context menu when right clicking the stage */
stage.on('contextmenu', function (e) {
    e.evt.preventDefault(); /* Prevent the default context menu from showing */
    destroyLines(); /* Clear any existing lines before showing the context menu */
    showContextMenu(e.evt.clientX, e.evt.clientY);
});

stage.on('mousedown', function (e) {
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;
    if (drag) /* If in drag mode, we don't want to draw a line */
        return;
    initLine(pos); /* Initialize the line at the mouse position */
});

stage.on('mousemove', function (e) {
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;
    if (drag) /* If in drag mode, we don't want to draw a line */
        return;
    drawLine(pos); /* Update the line position as the mouse moves */
});

stage.on('mouseup', (e) => {
    destroyLines();
});

/* Prevent context menu from appearing on the collapse menu itself */
$('#collapseMenu').on('contextmenu', function () {
    return false;
});

/* Hide the context menu when left clicking the stage */
stage.on('click', function (e) {
    hideContextMenu();
});

$('.map-item').on('click', function () {
    hideContextMenu();
    map = {
        src: $(this).data('src'),
        R: $(this).data('radius'),
        name: $(this).data('name')
    }
    loadMap();
});

$('#mode').on('click', function () {
    drag = !drag; /* Toggle drag mode */
    if (drag) {
        $(this).text('Line Mode');
    } else {
        $(this).text('Drag Mode');
    }
    stage.draggable(drag); /* Enable or disable dragging the stage */
    hideContextMenu();
    return false;
});

/* Keep track of the context menu when expanding accordias, and keep on screen */
let resizeObserver = new ResizeObserver((e) => {
    let x = e[0].target.offsetLeft;
    let y = e[0].target.offsetTop;
    let w = e[0].target.offsetWidth;
    let h = e[0].target.offsetHeight;
    keepContextMenuOnScreen(x, y, w, h);
});
resizeObserver.observe($('#collapseMenu')[0]);

function toAxial(pos) {
    if (!map) {
        return null;
    }
    var r = 0;
    var q = 0;
    if (!map.flatTop) {
        q = (2 / 3 * pos.x) / R
        r = (-1 / 3 * pos.x + Math.sqrt(3) / 3 * pos.y) / R
    }
    else {
        q = (Math.sqrt(3) / 3 * pos.x - 1 / 3 * pos.y) / R
        r = (2 / 3 * pos.y) / R
    }
    return axialRound(Hex(q, r));
}

function axialSubtract(hexA, hexB) {
    return Hex(hexA.q - hexB.q, hexA.r - hexB.r)
}

function axialDistance(hexA, hexB) {
    var vec = axialSubtract(hexA, hexB)
    var d = (Math.abs(vec.q)
        + Math.abs(vec.q + vec.r)
        + Math.abs(vec.r)) / 2
    return d;
}

function axialRound(hex) {
    var q = Math.round(hex.q)
    var r = Math.round(hex.r)
    var s = Math.round(-hex.q - hex.r)

    var q_diff = Math.abs(q - hex.q)
    var r_diff = Math.abs(r - hex.r)
    var s_diff = Math.abs(s - (-hex.q - hex.r))

    if (q_diff > r_diff && q_diff > s_diff) {
        q = -r - s
    }
    else if (r_diff > s_diff) {
        r = -q - s
    }
    else {
        s = -q - r
    }
    return Hex(q, r)
}

function Hex(q, r) {
    return { q: q, r: r }
}

start();