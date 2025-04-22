;
// Plugin changing cursor before element. Working with all browsers except IE<9
//
// Using:
// $('.my-class').changeCursor('myurl/img.png, dx, dy, zIndex);
//
// dx, dy - coordinates of picture center. dx from left, dy from top.
//
// Designed by WebBrother.net

(function ($) {
    var browser = (function () {

        var ua = navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }

        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR\/(\d+)/);
            if (tem !== null) return 'Opera ' + tem[1];
        }

        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) !== null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    })();

    $.fn.changeCursor = function (cursorPicUrl, dx, dy, zIndex) {

        function inFunction(e) {
            $cursor.show();
            return false;
        }

        function outFunction(e) {
            $cursor.hide();
            return false;
        }

        function moveFunction(e) {
            cursor.style.left = e.clientX - dx + 'px';
            cursor.style.top = e.clientY - dy + 'px';
        }

        //defaults
        dx = dx || 0;
        dy = dy || 0;
        zIndex = zIndex || 1000;

        var IE      =   browser.indexOf('IE') != -1;
        var version =   +browser.replace( /^\D+/g, '');
        var $cursor =   $('#custom-cursor');
        var cursor  =   $cursor[0];
        var excluded=   'a, input';

        if ( !( IE && version < 9 ) ) {
            if ( $cursor.length === 0 ) {
                $cursor = $('<svg id="custom-cursor"></svg>')// svg - hack for rendering performance
                    .css({
                        background: 'url("' + cursorPicUrl + '") no-repeat left top',
                        position:   'fixed',
                        display:    'block',
                        'z-index':  zIndex,
                        'pointer-events': 'none',
                        transform: 'translateZ(0)'// hack to make this element rendering by GPU
                    })
                    .hide();
                $('body').append( $cursor );
                cursor = $cursor[0];
            }

            this.on( "mouseenter", inFunction )
                .on( "mouseleave", outFunction )
                .on( "mousemove",  moveFunction)
                .css( 'cursor', 'none')
                .css( 'cursor', 'none');

            $(excluded)
                .on( "mouseenter", outFunction )
                .on( "mouseleave", inFunction);
        }

        return this;
    };

})(jQuery);