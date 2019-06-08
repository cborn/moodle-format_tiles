// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Javascript Module to handle adding and removing a semi transparent black overlay to the window.
 * Open tiles and tile content sit ojn top of it.  Closed tiles sit behind it.
 * Called when in non editing mode.
 * As this involves manipulating z-indices and can therefore cause conflict with some themes,
 * there is an option for the developer to disable it.  To do that, go to format.php and, in
 * the variable $jsparams set 'useWindowOverlay' to false.  This AMD module will then be ignored.
 *
 * @module window_overlay
 * @package course/format
 * @subpackage tiles
 * @copyright 2019 David Watson {@link http://evolutioncode.uk}
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since Moodle 3.7
 */

/* eslint space-before-function-paren: 0 */

define(["jquery"], function ($) {
    "use strict";

    var windowOverlay;
    var headerOverlay;
    var body = $("body");

    var Selector = {
        PAGE: "#page",
        TILEID: "#tile-",
        SECTION_ID: "#section-",
    };
    var ClassNames = {
        HEADER_OVERLAY: "header-overlay"
    };

    var CSS = {
        DISPLAY: "display",
        Z_INDEX: "z-index",
        HEIGHT: "height",
        BG_COLOUR: "background-color"
    };
    /**
     * Because headeroverlay may not exist, we want to avoid trying to fade if not there.
     * @param {boolean|undefined} fadeIn whether to fade in (fade out otherwise).
     * @returns {boolean}
     */
    var fadeHeaderInOut = function (fadeIn) {
        if (!headerOverlay) {
            return false;
        } else {
            if (fadeIn === true) {
                headerOverlay.fadeIn(300);
            } else {
                headerOverlay.fadeOut(300);
            }
            return true;
        }
    };

    /**
     * Temporary function to adjust shade of RGB colour
     * (used for shading tiles to get around transparent background on overlay issue)
     * @param {number} R
     * @param {number} G
     * @param {number} B
     * @param {number} percent
     * @returns {string}
     */
    var shadeRGBColor = function (R, G, B, percent) {
        var t = percent < 0 ? 0 : 255;
        var p = percent < 0 ? percent * -1 : percent;
        var r = Math.round((t - R) * p) + R;
        var g = Math.round((t - G) * p) + G;
        var b = Math.round((t - B) * p) + B;
        return "rgb(" + r + "," + g + "," + b + ")";
    };

    var getZIndex = function () {
        var overlayZIndex = parseInt(windowOverlay.css(CSS.Z_INDEX));
        return overlayZIndex > 0 ? overlayZIndex : 0;
    };

    /**
     * Add an opaque modal backdrop like div to obscure all other tiles and bring specified tile and content to front
     * @param {number} secNumOnTop the section number which should be displayed on top of the overlay
     */
    var set = function (secNumOnTop) {
        windowOverlay.fadeIn(300);
        var backDropZIndex = parseInt(windowOverlay.css(CSS.Z_INDEX));
        backDropZIndex = backDropZIndex > 0 ? backDropZIndex : 0;
        var tile = $(Selector.TILEID + secNumOnTop);
        tile.css(CSS.Z_INDEX, (backDropZIndex + 1));
        fadeHeaderInOut(true);
        $(Selector.SECTION_ID + secNumOnTop).css(CSS.Z_INDEX, (backDropZIndex + 1));
        if (tile.css(CSS.BG_COLOUR) && tile.css(CSS.BG_COLOUR).substr(0, 4) === "rgba") {
            // Tile may have transparent background from theme - needs to be solid otherwise modal shows through.
            var existingColour = tile.css(CSS.BG_COLOUR).replace("rgba(", "").replace(")", "").replace(" ", "").split(",");
            tile.css(CSS.BG_COLOUR, shadeRGBColor(
                parseInt(existingColour[0]),
                parseInt(existingColour[1]),
                parseInt(existingColour[2]),
                0.95
            ));
        }
    };

    var setHeaderBarOverlay = function (headerBar) {
        if (headerBar.attr("id") !== "navwrap") {
            // ID navwrap suggests theme is Adaptable based. We don't bother with header overlay if so.
            // Otherwise the header bar has a separate mini overlay of its own - find and hide this.
            // If it is clicked, cancel tile selections and click the item behind where clicked.
            // Do not include for Moodle 3.5 or higher as not needed.
            if (headerBar.height() !== undefined) {
                var headerOverlay = $("<div></div>")
                    .addClass(ClassNames.HEADER_OVERLAY).attr("id", ClassNames.HEADER_OVERLAY)
                    .css(CSS.DISPLAY, "none");
                headerOverlay.insertAfter(Selector.PAGE)
                    .css(CSS.Z_INDEX, (getZIndex()) + 3).css(CSS.HEIGHT, headerBar.outerHeight());
                return headerOverlay;
            }
        }
        return false;
    };

    return {
        getZIndex: function () {
            return getZIndex();
        },

        fadeIn: function () {
            if (windowOverlay.css(CSS.DISPLAY) === "none") {
                windowOverlay.fadeIn(300);
            }
        },

        getWindowOverlay: function() {
            if (windowOverlay === undefined) {
                // When a tile is clicked we add an overlay to grey out the rest of the tiles on the page, so prepare it.
                windowOverlay = $("<div></div>").addClass("modal-backdrop fade in").hide()
                    .attr("id", "window-overlay").appendTo(body);
            }
            return windowOverlay;
        },

        fadeOut: function () {
            if (windowOverlay.css(CSS.DISPLAY) === "block") {
                windowOverlay.fadeOut(300);
                fadeHeaderInOut(false);
            }
        },

        set: function (secNumOnTop) {
            set(secNumOnTop);
        },

        getHeaderBarOverlay: function(headerBar) {
            if (headerOverlay === undefined) {
                headerOverlay = setHeaderBarOverlay(headerBar);
            }
            return headerOverlay;
        },

        isVisible: function() {
            return windowOverlay.is(":visible");
        }
    };
});