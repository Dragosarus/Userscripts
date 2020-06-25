// ==UserScript==
// @name         Play Youtube playlist in reverse order
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      2.0
// @description  Adds button for loading the previous video in a YT playlist
// @author       Dragosarus
// @match        www.youtube.com/watch?*list*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

// Cookies (current session):
// pytplir_playPrevious - saves the button state between loads

(function() {
    'use strict';

    // Your code here...
    $(document).ready(function() {
        var activeColor = "rgb(64,166,255)";
        var inactiveColor = "rgb(144,144,144)";
        var circleColor = "rgb(144,144,144)";
        var ttBGColor = "rgb(100,100,100)";
        var ttTextColor = "rgb(237,240,243)";

        var player;
        var arrow_up;
        var arrow_down;
        var btn_svg;
        var btn_div;
        var playPrevious;
        var redirectFlag = false;
        // remove the need to refresh the page for the script to work properly
        $("html")[0].addEventListener("yt-navigate-finish",init);
        $("html")[0].addEventListener("yt-navigate-start",removeButton);

        init();

        function init() {
            playPrevious = getCookie("pytplir_playPrevious");
            if (playPrevious === "") { // cookie has not been set yet
                playPrevious = false; // inital state
                setCookie("pytplir_playPrevious",playPrevious);
            }

            // create button
            btn_div = document.createElement("div");
            var bg_circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
            var bg_circle_anim = document.createElementNS("http://www.w3.org/2000/svg","animate");
            arrow_up = document.createElementNS("http://www.w3.org/2000/svg","polygon");
            arrow_down = document.createElementNS("http://www.w3.org/2000/svg","polygon");
            btn_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
            var tt_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
            var tt_svg_fadein = document.createElementNS("http://www.w3.org/2000/svg","animate");
            var tt_svg_fadeout = document.createElementNS("http://www.w3.org/2000/svg","animate");
            var tt_rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
            var tt_text = document.createElementNS("http://www.w3.org/2000/svg","text");

            bg_circle_anim.setAttribute("attributeName","fill-opacity");
            bg_circle_anim.setAttribute("values","0;0.1;0.2;0.1;0.0");
            bg_circle_anim.setAttribute("dur","0.3s");
            bg_circle_anim.setAttribute("restart","always");
            bg_circle_anim.setAttribute("repeatCount","1");
            bg_circle_anim.setAttribute("begin","pytplir_btn.click");
            bg_circle_anim.setAttribute("end","pytplir_btn.click");
            bg_circle.setAttribute("cx","20");
            bg_circle.setAttribute("cy","20");
            bg_circle.setAttribute("r","20");
            bg_circle.setAttribute("fill",circleColor);
            bg_circle.setAttribute("fill-opacity","0");
            bg_circle.appendChild(bg_circle_anim);
            arrow_up.setAttribute("points","17,19 17,17 13,17 20,11 27,17 23,17 23,19");
            arrow_down.setAttribute("points","17,21 17,23 13,23 20,29 27,23 23,23 23,21");

            btn_svg.setAttribute("viewbox","0 0 40 40");
            btn_svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
            btn_svg.setAttribute("width","40");
            btn_svg.setAttribute("height","40");
            btn_svg.setAttribute("style","cursor: pointer; margin-left: 8px;");
            btn_svg.setAttribute("id","pytplir_btn");
            btn_svg.addEventListener("click",onButtonClick);
            btn_svg.appendChild(bg_circle);
            btn_svg.appendChild(arrow_up);
            btn_svg.appendChild(arrow_down);

            tt_rect.setAttribute("x","0");
            tt_rect.setAttribute("y","0");
            tt_rect.setAttribute("rx","2");
            tt_rect.setAttribute("ry","2");
            tt_rect.setAttribute("width","110");
            tt_rect.setAttribute("height","34");
            tt_rect.setAttribute("fill",ttBGColor);
            tt_rect.setAttribute("fill-opacity","0.9");

            tt_text.setAttribute("x","8");
            tt_text.setAttribute("y","22");
            tt_text.setAttribute("font-family","Roboto, Noto, sans-serif");
            tt_text.setAttribute("font-size","13px");
            tt_text.setAttribute("fill",ttTextColor);
            tt_text.setAttribute("style","user-select:none;");
            tt_text.innerHTML = "Autoplay order";

            tt_svg_fadein.setAttribute("attributeType","CSS");
            tt_svg_fadein.setAttribute("attributeName","opacity");
            tt_svg_fadein.setAttribute("values","0;1");
            tt_svg_fadein.setAttribute("dur","0.1s");
            tt_svg_fadein.setAttribute("restart","always");
            tt_svg_fadein.setAttribute("repeatCount","1");
            tt_svg_fadein.setAttribute("begin","pytplir_btn.mouseenter");
            tt_svg_fadein.setAttribute("end","pytplir_btn.mouseleave");
            tt_svg_fadein.setAttribute("fill","freeze");
            tt_svg_fadeout.setAttribute("attributeType","CSS");
            tt_svg_fadeout.setAttribute("attributeName","opacity");
            tt_svg_fadeout.setAttribute("values","1;0");
            tt_svg_fadeout.setAttribute("dur","0.1s");
            tt_svg_fadeout.setAttribute("restart","always");
            tt_svg_fadeout.setAttribute("repeatCount","1");
            tt_svg_fadeout.setAttribute("begin","pytplir_btn.mouseleave");
            tt_svg_fadeout.setAttribute("end","pytplir_btn.mouseenter");
            tt_svg_fadeout.setAttribute("fill","freeze");
            tt_svg.setAttribute("viewbox","0 0 100 34");
            tt_svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
            tt_svg.setAttribute("width","100");
            tt_svg.setAttribute("height","34");
            var tt_svg_offset = "position:relative; top:50px; left:-80px; z-index:100; opacity:0.0;"
            tt_svg.setAttribute("style","padding-left: 10px; fill:" + ttBGColor + "; " + tt_svg_offset);
            tt_svg.setAttribute("id","pytplir_tt");
            tt_svg.appendChild(tt_rect);
            tt_svg.appendChild(tt_text);
            tt_svg.appendChild(tt_svg_fadein);
            tt_svg.appendChild(tt_svg_fadeout);

            btn_div.setAttribute("id","pytplir_div");
            btn_div.appendChild(btn_svg);
            btn_div.appendChild(tt_svg);

            setTimeout(addButton, 500);
            setTimeout(start, 500);
        }

        function onButtonClick() { // toggle
            playPrevious = !playPrevious;
            setCookie("pytplir_playPrevious",playPrevious);
            updateButtonState();
        }

        function addButton() {
            withQuery(".ytd-playlist-panel-renderer > #top-level-buttons", function(res) {
                if (!document.getElementById("pytplir_btn")) {
                    res[0].appendChild(btn_div);
                    updateButtonState();
                }
            });
        }

        function updateButtonState() {
            if (playPrevious) { // play previous video
                arrow_up.setAttribute("style","fill:"+activeColor);
                arrow_down.setAttribute("style","fill:"+inactiveColor);
            } else { // play next video
                arrow_up.setAttribute("style","fill:"+inactiveColor);
                arrow_down.setAttribute("style","fill:"+activeColor);
            }
        }

        function removeButton() {
            btn_svg.parentNode.removeChild(btn_svg);
        }

        function start() {
            withQuery(".html5-main-video", function(res) {
                player = res[0];
                player.addEventListener("timeupdate",checkTime);
            });
        }

        function withQuery(query, onSuccess) {
            var res = $(query);
            if (res) {
                onSuccess(res);
                return res;
            } else { // not loaded yet => retry
                setTimeout(function(){withQuery(query);}, 100);
            }
        }

        function checkTime() {
            var timeLeft = player.duration - player.currentTime;
            var shuffle = strToBool($("[aria-label='Shuffle playlist']")[0].attributes["aria-pressed"].nodeValue);
            if (playPrevious && timeLeft < 1.3 && !redirectFlag && !player.hasAttribute("loop") && !shuffle) {
                redirectFlag = true;
                redirect();
                setTimeout(function() {redirectFlag = false;}, 1000);
            }
        }

        function redirect() {
            var previousURL = getPreviousURL();
            if (previousURL) {
                document.location.href = previousURL;
            } else { // probably at start of playlist
                player.pause(); // prevent next video from loading
            }
        }

        function getPreviousURL(){
            var query = document.querySelectorAll("#playlist-items");
            var index;
            var previousURL;
            for (const a of Array.from(query).entries()) { // a = {index, element}
                if (a[1].textContent.includes("▶")) { // Current video's position in playlist
                    index = a[0]; // index in query
                    if (index == 0) {break;} // start of list
                    previousURL = query[index-1].children[0].href;
                    return previousURL;
                }
            }
        }

        function strToBool(str) {
            return str.toLowerCase() == "true" ? true : false;
        }

        // adapted from https://www.w3schools.com/js/js_cookies.asp
        function setCookie(cname, cvalue) {
            document.cookie = cname + "=" + cvalue + ";sameSite=lax;path=www.youtube.com/watch";
        }

        function getCookie(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for(var i = 0; i <ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    var x = c.substring(name.length, c.length);
                    return strToBool(x);
                }
            }
            return "";
        }
    });
})();
