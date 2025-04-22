const ppi = 96.3636; // Pixels per inch
let map = {
    name: 'WaveEchoCave',
    folder: 'Phandelver',
    S: 70,
    stage: null,
}
let drawMode = false;
let drawLine = false;

let fog = null;
let target;

let stage = new Konva.Stage({
    container: 'canvas',
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: false, // Disable dragging by default
    x: 0,
    y: 0,
});

const mapLayer = new Konva.Layer(
    { listen: false }
);
stage.add(mapLayer);

const fogLayer = new Konva.Layer();
stage.add(fogLayer);

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

/****************************************************/
/* Functions                                        */
function start() {
    setSplashscreen(0);
}

function setSplashscreen(index) {

    if (index > 14) {
        index = 0;
    }
    const mapObj = new Image();
    mapObj.onload = function () {
        const mapImg = new Konva.Image({
            image: mapObj,
            height: stage.height(),
            width: stage.width(),
        });
        mapLayer.destroyChildren();
        mapLayer.add(mapImg);
    };
    mapObj.src = `/static/img/dnd/splashscreen_${index}.jpg`;
    setTimeout(function () {
        index++;
        setSplashscreen(index);
    }, 60000);
}

function loadMap() {
    stage = map.stage.FromJSON();
    stage.draw();
}

function closeContextMenu() {
    $('#collapseMenu').collapse('hide'); // Hide the context menu
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
/****************************************************/

/****************************************************/
/* Handlers                                         */

function handleDragLine(pos) {
    if (!drawLine || !fog || !drawMode)
        return;
    const newPoints = fog.points().slice();
    newPoints[newPoints.length - 2] = pos.x;
    newPoints[newPoints.length - 1] = pos.y;
    fog.points(newPoints);
}

function handleNextPoint(pos) {
    if (!fog)
        return;
    const newPoints = fog.points().concat([pos.x, pos.y]);
    fog.points(newPoints);
}

function handleFinishFog(pos) {
    drawLine = false;
    fog.stroke('rgba(0, 0, 0, 1)');
    fog.fill('rgba(0, 0, 0, 1)');
    $('#nameFogModal').modal('show');
    $('#nameFogModal').off('shown.bs.modal').on('shown.bs.modal', function () {
        $('#fogNameInput').focus();
    });
}

function handleShowContextMenu(pos) {
    $("#collapseMenu").css({ top: pos.y, left: pos.x, position: 'absolute' });
    $('#collapseMenu').collapse('show');
    keepContextMenuOnScreen(pos.x, pos.y, $('#collapseMenu').outerWidth(), $('#collapseMenu').outerHeight());
}

function handleStartFog(pos) {
    drawLine = true;
    fog = new Konva.Line({
        stroke: 'rgba(192, 0, 0, 0.75)',
        closed: true,
        strokeWidth: 3,
        fill: 'rgba(0, 0, 0, 0.5)',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y]
    });
    fog.on('mousemove touchmove', function (e) {
        if (drawLine)
            return;
        const pos = stage.getPointerPosition();
        if (pos) {

            pos.x = pos.x - stage.attrs.x;
            pos.y = pos.y - stage.attrs.y;

            tooltip.x(pos.x + 10);
            tooltip.y(pos.y - 10);

            tooltipText.text(this.attrs.name);
            tooltipRect.width(tooltipText.width());
            tooltipRect.height(tooltipText.height());

            tooltip.show();
        }
    });
    fog.on('mouseout', function () {
        tooltip.hide();
    });
    fogLayer.add(fog);
}
/****************************************************/

/****************************************************/
/* Konva Events                                     */
stage.on('mousedown touchstart', function (e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;

    if (e.evt.button === 0 && drawMode) {
        if (!drawLine) {
            handleStartFog(pos);
        } else {
            handleNextPoint(pos);
        }
    }
    if (e.evt.button === 2 && drawMode && drawLine) {
        e.evt.preventDefault();
        handleFinishFog(pos);
    }
});

stage.on('click', function (e) {
    closeContextMenu();
});

stage.on('dragmove', function (e) {
    const pos = stage.getPointerPosition();
    //    fogLayer.offsetX(stage.offsetX());
    //    fogLayer.offsetY(stage.offsetY());
});

stage.on('mousemove touchmove', function (e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;
    if (drawLine && fog) {
        handleDragLine(pos);
    }
});

stage.on('contextmenu', function (e) {
    const pos = stage.getPointerPosition();
    target = e.target;
    e.evt.preventDefault();
    if (!drawLine) {
        handleShowContextMenu(pos);
    }
});
/****************************************************/

/****************************************************/
/* HTML Events                                      */
$('#drawFogOfWar').on('click', function () {
    if (!drawMode) {
        drawMode = true;
        $(this).html('Drag Mode');
        stage.draggable(false);
    } else {
        drawMode = false;
        $(this).html('Draw Mode');
        stage.draggable(true);
    }
    closeContextMenu();
});

$('#saveFog').on('click', function () {
    const fogName = $('#fogNameInput').val().trim();
    if (fogName === '') {
        fog.destroy();
        return;
    }
    fog.name(fogName);
    fogLayer.draw();
    $('#nameFogModal').modal('hide');
    drawFree = false;
    fog = null;

});

$('#cancelFog').on('click', function () {
    if (fog) {
        fog.destroy();
        fogLayer.draw();
    }
    $('#nameFogModal').modal('hide');
    drawFree = false;
    fog = null;
});

$('#revealFogOfWar').on('click', function () {
    if (target) {
        target.destroy();
        fogLayer.draw();
    }
    closeContextMenu();
});

$('#saveMap').on('click', function () {
    map.stage = stage.toJSON();
    $.ajax({
        url: "/dnd/save",
        method: "POST",
        data: map,
        contentType: "application/json",
        success: function (response) {
            console.log("Data: " + response);
        },
        error: function (xhr, status, error) {
            console.error("Error: " + error);
        }
    });
});

$(".map-item").on('click', function () {    
    const mapName = $(this).data('name');
    const mapFolder = $(this).data('folder');
    $ajax({
        url: `/dnd/load/${mapFolder}/${mapName}`,
        method: "GET",
        success: function (response) {
            map = response;
            loadMap();
        },
        error: function (xhr, status, error) {
            console.error("Error: " + error);
        }
    });
    closeContextMenu();
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
/****************************************************/

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

start();