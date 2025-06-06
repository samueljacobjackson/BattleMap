let scale = 1;
let map;
let dragMode = false;
let drawing = false;
let startHex = { q: 0, r: 0 };
let target;
let line;

const stage = new Konva.Stage({
    container: 'canvas',
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: false,
    x: 0,
    y: 0
});
stage.on('contextmenu', contextmenu);
stage.on('mousedown', mousedown);
stage.on('mousemove', mousemove);
stage.on('mouseup', mouseup);
//stage.on('click', click);

let mapLayer = new Konva.Layer({
    listening: false,
    zIndex: 100
});
stage.add(mapLayer);

const lineLayer = new Konva.Layer({
    listening: false,
    zIndex: 200
});
stage.add(lineLayer);

const tooltipLayer = new Konva.Layer({
    listening: false,
    zIndex: 300
});
stage.add(tooltipLayer);

const tooltipText = new Konva.Text({
    text: '',
    fontFamily: 'Calibri',
    fontSize: 28,
    padding: 5,
    fill: 'rgba(255,255,255,1)',
    listening: false,
    align: 'center',
    verticalAlign: 'middle',
});

const tooltip = new Konva.Group({
    listening: false,
});

const tooltipRect = new Konva.Rect({
    fill: 'green',
    opacity: 0,
});

tooltip.add(tooltipRect);
tooltip.add(tooltipText);
tooltipLayer.add(tooltip);

$('#collapseMenu').on('contextmenu', function () { return false; });
$('.map-item').on('click', mapItemClick);
$('#setDragMode').on('click', setDragModeClick);
$('#lockMap').on('click', lockMapClick);

/******************************************************************/
/* Functions ******************************************************/
function destroyLines() {
    lineLayer.destroyChildren();
    tooltip.hide();
    drawing = false;
}

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
    moveTooltip(text, { x: pos.x - 23, y: pos.y - 20 }); /* Display the tooltip with the distance */
}

function hideContextMenu() {
    $(".accordion-collapse").removeClass("show");
    $('#collapseMenu').collapse('hide');
    $('#collapseMenu2').collapse('hide');
    $('#noteModal').collapse('hide');
    $('#noteModal').addClass('hode').removeClass('show');
    $('#noteModal').css('display', 'none');
    $('#noteModal').css('opacity', '0');
    $('#saveModal').collapse('hide');
    $('#saveModal').addClass('hode').removeClass('show');
    $('#saveModal').css('display', 'none');
    $('#saveModal').css('opacity', '0');
    $('#noteInput').val('');
}

function initLine(pos) {
    if (!map)
        return;
    drawing = true;
    line = new Konva.Line({
        stroke: 'blue',
        strokeWidth: 3,
        listening: false,
        points: [pos.x - 23, pos.y - 20 , pos.x - 20 , pos.y]
    });
    lineLayer.add(line);
    startHex = toAxial(pos);
    moveTooltip('0', { x: pos.x - 23, y: pos.y - 20 });
    tooltip.show();
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
    $('#collapseMenu2').css({ top: y, left: x, position: 'absolute' });
}

function loadMap() {
   // stage.destroyChildren();

    mapLayer.destroy();
    mapLayer = new Konva.Layer({
        listening: false
    });
    stage.add(mapLayer);

    lineLayer.moveToTop();
    tooltipLayer.moveToTop();
    
    scale = R / map.R;
    mapObj = new Image();
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

function moveTooltip(text, pos) {
    tooltip.x(pos.x);
    tooltip.y(pos.y);
    tooltipText.text(text);
    tooltipText.width(50);
    tooltipText.height(40);
    tooltipText.align('center');
    tooltip.width(tooltipText.width());
    tooltip.height(tooltipText.height());
    tooltipRect.width(tooltipText.width());
    tooltipRect.height(tooltipText.height());
}

function showContextMenu(pos) {
    $("#collapseMenu").css({ top: pos.y, left: pos.x, position: 'absolute' });
    if (map) {
        $('#collapseMenu').collapse('show');
        keepContextMenuOnScreen(pos.x, pos.y, $('#collapseMenu').width(), $('#collapseMenu').height());
    } else {
        $('#collapseMenu2').collapse('show');
        keepContextMenuOnScreen(pos.x, pos.y, $('#collapseMenu2').width(), $('#collapseMenu2').height());
    }
}

function setSplashscreen(index) {
    if (map)
        return;
    if (index > 14) {
        index = 0;
    }
    const mapObj = new Image();
    mapObj.onload = function () {
        const mapImg = new Konva.Image({
            image: mapObj,
            height: stage.height(),
            width: stage.width()
        });
        mapLayer.destroyChildren();
        mapLayer.add(mapImg);
    };
    mapObj.src = `/static/img/battletech/splashscreen_${index}.jpg`;
    setTimeout(function () {
        index++;
        setSplashscreen(index);
    }, 60000)
}

function start() {
    lineLayer.moveToTop();
    tooltipLayer.moveToTop();
    setSplashscreen(0);
}
/******************************************************************/

/******************************************************************/
/* Konva Event Handlers *******************************************/

function contextmenu(e) {
    e.evt.preventDefault();
    pos = stage.getPointerPosition();
    target = e.target;
    destroyLines();
    showContextMenu(pos);
};

function mousedown(e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;
    if (dragMode) /* If in drag mode, we don't want to draw a line */
        return;
    initLine(pos); /* Initialize the line at the mouse position */
};

function mousemove(e) {
    e.evt.preventDefault();
    const pos = stage.getPointerPosition();
    pos.x = pos.x - stage.attrs.x;
    pos.y = pos.y - stage.attrs.y;
    if (dragMode) /* If in drag mode, we don't want to draw a line */
        return;
    drawLine(pos); /* Update the line position as the mouse moves */
};

function mouseup(e) {
    e.evt.preventDefault();
    destroyLines();
};

function lockMapClick() {
    dragMode = false;
    drawing = true;
    $('#setDragMode').addClass('btn-primary').removeClass('btn-success');
    $('#setDragMode').text('Drag Mode (Off)');

    $('#lockMap').addClass('btn-success').removeClass('btn-primary');
    $('#lockMap').text('Lock (On)');

    stage.draggable(false);
    hideContextMenu();
    return false;
};

function mapItemClick() {
    hideContextMenu();
    const mapName = $(this).data('name');
    const mapFolder = $(this).data('folder');

    $.ajax({
        url: `/battletech/load?mapFolder=${mapFolder}&mapName=${mapName}`,
        method: "GET",
        success: function (response) {
            if (!response.error) {
                map = JSON.parse(response.data);
                loadMap();
            } else {
                console.error(response.message);
                alertBanner(response.message, 'danger');
            }
        },
        error: function (xhr, status, error) {
            console.error(error.message);
            alertBanner(error.message, 'danger');
        }
    });
}

function setDragModeClick() {
    dragMode = true;
    drawing = false;
    $('#setDragMode').addClass('btn-success').removeClass('btn-primary');
    $('#setDragMode').text('Drag Mode (On)');

    $('#lockMap').addClass('btn-primary').removeClass('btn-success');
    $('#lockMap').text('Lock (Off)');

    stage.draggable(true);
    hideContextMenu();
    return false;
}

let resizeObserver = new ResizeObserver((e) => {
    let x = e[0].target.offsetLeft;
    let y = e[0].target.offsetTop;
    let w = e[0].target.offsetWidth;
    let h = e[0].target.offsetHeight;
    keepContextMenuOnScreen(x, y, w, h);
});
resizeObserver.observe($('#collapseMenu')[0]);
/******************************************************************/

/******************************************************************/
/* Hexagonal grid functions ***************************************/
function toAxial(pos) {
    if (!map) {
        return null;
    }
    var r = 0;
    var q = 0;
    if (map.flatTop) {
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
/******************************************************************/

start();