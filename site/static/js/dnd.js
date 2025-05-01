

let map = null;

let drawMode = false;
let dragMode = false;
let lockMode = false;

let rotation = 0;
let drawLine = false;
let newScale = 1;
let scaleBy = 1.05;
let minScale = 0.1;
let maxScale = 1;
let fog = null;
let target;

let stage = new Konva.Stage({
    container: 'canvas',
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: false, // Disable dragging by default
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1
});
stage.on('mousedown', mousedown);
stage.on('click', (e) => { e.evt.preventDefault(); });
stage.on('mousemove', mousemove);
stage.on('contextmenu', contextmenu);
stage.on('mouseup', mouseup);
stage.on('wheel', wheel);

let mapLayer = new Konva.Layer({
    listen: false,

    name: 'mapLayer'
});
stage.add(mapLayer);

let fogLayer = new Konva.Layer({
    name: 'fogLayer',
});
stage.add(fogLayer);

let tooltipLayer = new Konva.Layer({
    listening: false,
    name: 'tooltipLayer'
});
stage.add(tooltipLayer);

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

let mapObj = new Image();
mapObj.onload = function () {
    const mapImg = new Konva.Image({
        image: mapObj,
        height: stage.height(),
        width: stage.width(),
    });
    mapLayer.destroyChildren();
    mapLayer.add(mapImg);
};

function start() {
    splashScreen(0);
}

/****************************************************/
/* Handlers                                         */

function closeContextMenu() {
    $('.collapse').collapse('hide');
    $('#collapseMenu').collapse('hide'); // Hide the context menu
    $('#saveFogModal').modal('hide'); // Hide the save modal
    $('#nameFogModal').modal('hide'); // Hide the name modal
}

function dragLine(pos) {
    if (!drawLine || !fog || !drawMode || lockMode)
        return;
    const newPoints = fog.points().slice();
    newPoints[newPoints.length - 2] = pos.x;
    newPoints[newPoints.length - 1] = pos.y;
    fog.points(newPoints);
}

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

function loadMap() {
    // Set to drag mode
    drawMode = false;
    dragMode = true;
    lockMode = false;
    drawLine = false;

    stage.destroyChildren();

    mapLayer = Konva.Node.create(map.mapLayer);
    fogLayer = Konva.Node.create(map.fogLayer);

    stage.add(mapLayer);
    stage.add(fogLayer);

    tooltip.add(tooltipRect);
    tooltip.add(tooltipText);
    tooltipLayer.add(tooltip);

    stage.add(mapLayer);
    stage.add(fogLayer);
    stage.add(tooltipLayer);
    stage.draggable(true);

    fogLayer.find('Line').forEach(function (line) {
        line.on('mousemove', fogMousemove);
        line.on('mouseout', fogMouseout);
    });

    mapObj = new Image();
    mapObj.onload = function () {
        const mapImg = new Konva.Image({
            image: mapObj,
            width: mapObj.width * (S / map.S),
            height: mapObj.height * (S / map.S),
        });
        mapLayer.destroyChildren();
        mapLayer.add(mapImg);
    }
    mapObj.src = map.src;

    mapLayer.draw();
    fogLayer.draw();

    dragMode = true;
    drawMode = false;
    lockMode = false;
    stage.draggable(true);

    newScale = 1;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    $('#drawMap').addClass('btn-primary').removeClass('btn-success');
    $('#dragMap').addClass('btn-success').removeClass('btn-primary');
    $('#lockMap').addClass('btn-primary').removeClass('btn-success');
}

function nextPoint(pos) {
    if (!map)
        return;
    if (lockMode) {
        finishFog(pos);
        return;
    }
    if (!fog)
        return;
    const newPoints = fog.points().concat([pos.x, pos.y]);
    fog.points(newPoints);
}

function finishFog(pos) {
    if (!map)
        return;
    if (!drawLine)
        return;
    drawLine = false;
    fog.stroke('rgba(0, 0, 0, 1)');
    fog.fill('rgba(0, 0, 0, 1)');
    $('#nameFogModal').modal('show');
    $('#nameFogModal').off('shown.bs.modal').on('shown.bs.modal', function () {
        $('#fogNameInput').focus();
    });
}

/*
function rotateMap() {
    if (!map)
        return;
    if (lockMode)
        return;

    rotation = stage.rotation() + 90;
    mapLayer.rotation(rotation);
    fogLayer.rotation(rotation);
    tooltipLayer.rotation(rotation);
}
*/

function splashScreen(index) {
    if (map)
        return;
    if (index > 14) {
        index = 0;
    }
    mapObj.src = `/static/img/dnd/splashscreen_${index}.jpg`;
    setTimeout(function () {
        index++;
        splashScreen(index);
    }, 60000);
}

function showContextMenu(pos) {
    $("#collapseMenu").css({ top: pos.y, left: pos.x, position: 'absolute' });
    $('#collapseMenu').collapse('show');
    keepContextMenuOnScreen(pos.x, pos.y, $('#collapseMenu').outerWidth(), $('#collapseMenu').outerHeight());
}

function startFog(pos) {
    if (!map)
        return;
    if (dragMode || lockMode)
        return;
    drawLine = true;
    fog = new Konva.Line({
        stroke: 'rgba(192, 0, 0, 0.75)',
        closed: true,
        strokeWidth: 3,
        fill: 'rgba(0, 0, 0, 0.35)',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y],
        fog: true,
    });
    fog.on('mousemove', fogMousemove);
    fog.on('mouseout', fogMouseout);
    fogLayer.add(fog);
}

/****************************************************/

/****************************************************/
/* Konva Events                                     */

function fogMousemove(e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();

    if (drawLine)
        return;

    if (pos) {
        pos.x = (pos.x - stage.attrs.x) / newScale;
        pos.y = (pos.y - stage.attrs.y) / newScale;

        tooltipText.text(this.attrs.name);

        const inverseScale = 1 / newScale;

        tooltip.x(pos.x + (10 * inverseScale));
        tooltip.y(pos.y - (10 * inverseScale));
        tooltipText.scale({ x: inverseScale, y: inverseScale });
        tooltipRect.width(tooltipText.width());
        tooltipRect.height(tooltipText.height());
        tooltipRect.scale({ x: inverseScale, y: inverseScale });

        tooltip.show();
        tooltip.moveToTop();
    }
};

function fogMouseout() {
    tooltip.hide();
};

function mousedown(e) {
    e.evt.preventDefault();

    const pos = stage.getPointerPosition();
    pos.x = (pos.x - stage.attrs.x) / newScale;
    pos.y = (pos.y - stage.attrs.y) / newScale;

    if (e.evt.button === 0 && drawMode && !lockMode) {
        stage.draggable(false);
        if (!drawLine) {
            startFog(pos);
        } else {
            nextPoint(pos);
        }
    }
    if (e.evt.button === 2) {
        closeContextMenu();
        finishFog(pos);
    }
    if (e.evt.button === 1) {
        if (lockMode)
            return;
        stage.draggable(true);
    }
};

function mouseup(e) {
    e.evt.preventDefault();
    if (e.evt.button === 1 && drawMode) {
        stage.draggable(false);
    }
}

function mousemove(e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    pos.x = (pos.x - stage.attrs.x) / newScale;
    pos.y = (pos.y - stage.attrs.y) / newScale;
    if (drawLine && fog) {
        dragLine(pos);
    }
};

function contextmenu(e) {
    e.evt.preventDefault();
    let pos = stage.getPointerPosition();

    target = e.target;
    if (!drawLine) {
        showContextMenu(pos);
    }
};

function wheel(e) {
    e.evt.preventDefault();
    if (!map)
        return;
    if (lockMode)
        return;
    let pos = stage.getPointerPosition();
    const oldScale = stage.scaleX();
    mousePointTo = {
        x: (pos.x - stage.x()) / oldScale,
        y: (pos.y - stage.y()) / oldScale,
    };
    let direction = e.evt.deltaY > 0 ? 1 : -1;
    if (e.evt.ctrlKey) {
        direction = -direction;
    }
    newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    if (newScale > 1) {
        newScale = 1;
    } else if (newScale < 0.1) {
        newScale = 0.1;
    }
    stage.scale({ x: newScale, y: newScale });
    newPos = {
        x: pos.x - mousePointTo.x * newScale,
        y: pos.y - mousePointTo.y * newScale,
    };
    
    const inverseScale = 1 / newScale;
    tooltip.x(pos.x + (10 * inverseScale));
    tooltip.y(pos.y - (10 * inverseScale));
    tooltipText.scale({ x: inverseScale, y: inverseScale });
    tooltipRect.width(tooltipText.width());
    tooltipRect.height(tooltipText.height());
    tooltipRect.scale({ x: inverseScale, y: inverseScale });

    stage.position(newPos);
}
/****************************************************/

/****************************************************/
/* HTML Events */

$('body').on('click', function (e) {
    e.preventDefault();
    if (!$(e.target).closest('#collapseMenu').length
        && !$(e.target).closest('#saveFogModal').length
        && !$(e.target).closest('#nameFogModal').length) {
        closeContextMenu();
    }
});

$("#collapseMenu").on("contextmenu", function (e) {
    e.preventDefault();
});

$('#drawMap').on('click', function () {
    if (map) {
        dragMode = false;
        drawMode = true;
        lockMode = false;
        stage.draggable(false);

        $('#drawMap').addClass('btn-success').removeClass('btn-primary');
        $('#dragMap').addClass('btn-primary').removeClass('btn-success');
        $('#lockMap').addClass('btn-primary').removeClass('btn-success');
    }
    closeContextMenu();
});

$('#dragMap').on('click', function () {
    if (map) {
        dragMode = true;
        drawMode = false;
        lockMode = false;
        stage.draggable(false);

        $('#drawMap').addClass('btn-primary').removeClass('btn-success');
        $('#dragMap').addClass('btn-success').removeClass('btn-primary');
        $('#lockMap').addClass('btn-primary').removeClass('btn-success');
    }
    closeContextMenu();
});

$('#lockMap').on('click', function () {
    if (map) {
        dragMode = false;
        drawMode = false;
        lockMode = true;
        stage.draggable(false);

        $('#drawMap').addClass('btn-primary').removeClass('btn-success');
        $('#dragMap').addClass('btn-primary').removeClass('btn-success');
        $('#lockMap').addClass('btn-success').removeClass('btn-primary');
    }
    closeContextMenu();
});

/*
$('#rotateMap').on('click', function () {
    if (map) {
        rotateMap();
    }
    closeContextMenu();
});
*/

$('#saveFog').on('click', function () {
    const fogName = $('#fogNameInput').val().trim();
    if (fogName === '') {
        fog.destroy();
        return;
    }
    fog.name(fogName);
    fogLayer.draw();
    $('#nameFogModal').modal('hide');
    fog = null;
    $('#fogNameInput').val('')
});

$('#cancelFog').on('click', function () {
    if (fog) {
        fog.destroy();
        fogLayer.draw();
    }
    $('#nameFogModal').modal('hide');
    fog = null;
});

$('#revealFogOfWar').on('click', function () {
    if (target.attrs.fog) {
        target.destroy();
        fogLayer.draw();
    }
    closeContextMenu();
});

$('#saveMap').on('click', function () {
    if (!map) {
        closeContextMenu();
        return;
    }
    map.mapLayer = mapLayer.toJSON();
    map.fogLayer = fogLayer.toJSON();
    map.tooltipLayer = tooltipLayer.toJSON();
    map.src = mapObj.src;
    $.ajax({
        url: "/dnd/save",
        method: "POST",
        data: JSON.stringify(map),
        contentType: "application/json",
        success: function (response) {
            if (!response.error) {
                console.log(response.message);
                alert(response.message, 'success');
            } else {
                console.error(response.message);
                alert(response.message, 'danger');
            }
        },
        error: function (xhr, status, error) {
            console.error(error.message);
            alert(error.message, 'danger');
        }
    });
    closeContextMenu();
});

$(".map-item").on('click', function () {
    const mapName = $(this).data('name');
    const mapFolder = $(this).data('folder');
    $.ajax({
        url: `/dnd/load?mapFolder=${mapFolder}&mapName=${mapName}`,
        method: "GET",
        success: function (response) {
            if (response.error) {
                console.error(response.message);
                alertBanner(response.message, 'danger');
                return;
            }
            map = JSON.parse(response.data);
            loadMap();
        },
        error: function (xhr, status, error) {
            console.error(error.message);
            alertBanner(error.message, 'danger');
        }
    });
    closeContextMenu();
});

$('#exitMap').on('click', function () {
    window.location.href = '/';
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

start();