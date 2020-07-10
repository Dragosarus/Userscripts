// ==UserScript==
// @name         Play Youtube playlist in reverse order
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      3.1
// @description  Adds button for loading the previous video in a YT playlist
// @author       Dragosarus
// @match        www.youtube.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

// Cookies (current session):
// pytplir_playPrevious - saves the button state between loads

/* NOTES:
 *    - Since version 2.3, due to how Youtube loads pages, @match has been expanded
 *      from www.youtube.com/watch?*list* to www.youtube.com/* in order to avoid having to refresh the page
 *      in order to run the script (and display the button). Change it back if this is not desired.
 *    - If the button is not displayed (but the script is running), reload the video via the playlist,
 *      refresh the page, or press 'i' twice (i.e. enter and exit miniplayer mode).
*/

(function() {
    'use strict';
    $(document).ready(function() {
        // Determines when to load the next video.
        // Increase these if the redirect does not work as intended (i.e. fails to override Youtube's redirect),
        // Decreasing these will let you see more of the video before it redirects, but the redirect might stop working (consistently)
        var redirectWhenTimeLeft = 0.2; // seconds before end of video
        var redirectWhenTimeLeft_miniplayer = 0.2;

        var activeColor = "rgb(64,166,255)";
        var inactiveColor = "rgb(144,144,144)";
        var circleColor = "rgb(144,144,144)";
        var ttBGColor = "rgb(100,100,100)";
        var ttTextColor = "rgb(237,240,243)";

        var player;
        var playPrevious;
        var ytdApp = $("ytd-app")[0];
        var redirectFlag = false;

        // create button
        var btn_div = document.createElement("div");
        var bg_circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
        var bg_circle_anim = document.createElementNS("http://www.w3.org/2000/svg","animate");
        var arrow_up = document.createElementNS("http://www.w3.org/2000/svg","polygon");
        var arrow_down = document.createElementNS("http://www.w3.org/2000/svg","polygon");
        var btn_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
        var tt_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
        var tt_svg_fadein = document.createElementNS("http://www.w3.org/2000/svg","animate");
        var tt_svg_fadeout = document.createElementNS("http://www.w3.org/2000/svg","animate");
        var tt_rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
        var tt_text = document.createElementNS("http://www.w3.org/2000/svg","text");
        var tt_div = document.createElement("div");

        bg_circle_anim.setAttribute("attributeName","fill-opacity");
        bg_circle_anim.setAttribute("values","0;0.1;0.2;0.1;0.0");
        bg_circle_anim.setAttribute("dur","0.3s");
        bg_circle_anim.setAttribute("restart","always");
        bg_circle_anim.setAttribute("repeatCount","1");
        bg_circle_anim.setAttribute("begin","indefinite");
        bg_circle_anim.setAttribute("id","pytplir_bg_circle_anim");
        bg_circle.setAttribute("cx","20");
        bg_circle.setAttribute("cy","20");
        bg_circle.setAttribute("r","20");
        bg_circle.setAttribute("fill",circleColor);
        bg_circle.setAttribute("fill-opacity","0");
        bg_circle.appendChild(bg_circle_anim);
        arrow_up.setAttribute("points","17,19 17,17 13,17 20,11 27,17 23,17 23,19");
        arrow_up.setAttribute("id","pytplir_arrow_up");
        arrow_down.setAttribute("points","17,21 17,23 13,23 20,29 27,23 23,23 23,21");
        arrow_down.setAttribute("id","pytplir_arrow_down");

        btn_svg.setAttribute("viewbox","0 0 40 40");
        btn_svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
        btn_svg.setAttribute("width","40");
        btn_svg.setAttribute("height","40");
        btn_svg.setAttribute("style","cursor: pointer; margin-left: 8px;");
        btn_svg.setAttribute("id","pytplir_btn");
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
        tt_svg_fadein.setAttribute("begin","indefinite");
        tt_svg_fadein.setAttribute("id","pytplir_tt_fadein");
        tt_svg_fadein.setAttribute("fill","freeze");
        tt_svg_fadeout.setAttribute("attributeType","CSS");
        tt_svg_fadeout.setAttribute("attributeName","opacity");
        tt_svg_fadeout.setAttribute("values","1;0");
        tt_svg_fadeout.setAttribute("dur","0.1s");
        tt_svg_fadeout.setAttribute("restart","always");
        tt_svg_fadeout.setAttribute("repeatCount","1");
        tt_svg_fadeout.setAttribute("begin","indefinite");
        tt_svg_fadeout.setAttribute("id","pytplir_tt_fadeout");
        tt_svg_fadeout.setAttribute("fill","freeze");
        tt_svg.setAttribute("viewbox","0 0 100 34");
        tt_svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
        tt_svg.setAttribute("width","100");
        tt_svg.setAttribute("height","34");
        var tt_svg_offset = "position:absolute; top:13px; left:-32px; z-index:100; opacity:0.0;";
        tt_svg.setAttribute("style","padding-left: 10px; fill:" + ttBGColor + "; " + tt_svg_offset);
        tt_svg.setAttribute("id","pytplir_tt");
        tt_svg.appendChild(tt_rect);
        tt_svg.appendChild(tt_text);
        tt_svg.appendChild(tt_svg_fadein);
        tt_svg.appendChild(tt_svg_fadeout);
        tt_div.setAttribute("style", "position:relative; width:0; height:0;");
        tt_div.appendChild(tt_svg);

        btn_div.setAttribute("id","pytplir_div");
        btn_div.appendChild(btn_svg);
        btn_div.appendChild(tt_div);
        $(btn_svg).on("click",onButtonClick);
        $(btn_svg).on("click",function(){$(this).parent().find("#pytplir_bg_circle_anim")[0].beginElement();});
        $(btn_svg).on("mouseenter",function(){$(this).parent().find("#pytplir_tt_fadein")[0].beginElement();});
        $(btn_svg).on("mouseleave",function(){$(this).parent().find("#pytplir_tt_fadeout")[0].beginElement();});

        // remove the need to refresh the page for the script to work properly
        $("html")[0].addEventListener("yt-navigate-finish",init); // most cases

        init();

        function init() {
            // remove the need to refresh the page for the script to work properly
            withQuery("ytd-player","*",function(res) {
                res[0].addEventListener("yt-player-updated",init); // when in miniplayer mode and (playPrevious is false or shuffle is on)
            });

            removeButton(); // try to ensure button is (re-)added properly
            playPrevious = getCookie("pytplir_playPrevious");
            if (playPrevious === "") { // cookie has not been set yet
                playPrevious = false; // inital state
                setCookie("pytplir_playPrevious",playPrevious);
            }
            setTimeout(addButton, 500);
            setTimeout(start, 500);
        }

        function onButtonClick() { // toggle
            playPrevious = !playPrevious;
            setCookie("pytplir_playPrevious",playPrevious);
            updateButtonState();
        }

        function addButton() {
            withQuery(".ytd-playlist-panel-renderer > div[id=top-level-buttons]", "*", function(res) {
                res.each(function() {
                    if (!$(this).filter(":has(#pytplir_div)").length) {
                        this.appendChild($(btn_div).clone(true)[0]);
                        updateButtonState();
                    }
                });
            });
        }

        function updateButtonState() {
            if (playPrevious) { // play previous video
                $("polygon[id=pytplir_arrow_up]").each(function() {
                    this.setAttribute("style","fill:"+activeColor);
                });
                $("polygon[id=pytplir_arrow_down]").each(function() {
                    this.setAttribute("style","fill:"+inactiveColor);
                });
            } else { // play next video
                $("polygon[id=pytplir_arrow_up]").each(function() {
                    this.setAttribute("style","fill:"+inactiveColor);
                });
                $("polygon[id=pytplir_arrow_down]").each(function() {
                    this.setAttribute("style","fill:"+activeColor);
                });
            }
        }

        function removeButton() {
            $("div[id=pytplir_div]").each(function(){
                this.parentNode.removeChild(this);
            });
        }

        function start() {
            withQuery(".html5-main-video", ":visible", function(res) {
                player = res[0];
                player.addEventListener("timeupdate",checkTime);
            });
        }

        function withQuery(query,filter="*", onSuccess = function(r){}) {
            var res = $(query).filter(filter);
            if (res.length) { // >= 1 result
                onSuccess(res);
                return res;
            } else { // not loaded yet => retry
                setTimeout(function(){withQuery(query);}, 100);
            }
        }

        function checkTime() {
            if (!$("#pytplir_div").length) {return;} // button not loaded

            var timeLeft = player.duration - player.currentTime;
            var videoPlayer = $(".html5-video-player")[0];
            var shuffle = strToBool($("path[d='M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z']").filter(":visible").parents("button[aria-pressed]")[0].attributes["aria-pressed"].nodeValue);
            try {videoPlayer.classList.contains("ad-showing");}
            catch (TypeError) { // video player undefined
            	return;
            }

            var redirectTime;
            if (ytdApp.hasAttribute("miniplayer-active_")) {
                redirectTime = redirectWhenTimeLeft_miniplayer;
            } else {
                redirectTime = redirectWhenTimeLeft;
            }

            if (playPrevious && timeLeft < redirectTime && !redirectFlag && !player.hasAttribute("loop") && !shuffle && !videoPlayer.classList.contains("ad-showing")) {
                // attempt to prevent the default redirect from triggering
                player.pause();
                player.currentTime -= 2;

                redirectFlag = true;
                redirect();
                setTimeout(function() {redirectFlag = false;}, 1000);
            }
        }

        function redirect() {
            var previousURL = getPreviousURL();
            if (previousURL) {
                previousURL.click();
            }
        }

        function getPreviousURL(){ // returns <a> element
            var elem;
            if (ytdApp.hasAttribute("miniplayer-active_")) { // avoid being forced out of miniplayer mode on video load
                elem = $("div.miniplayer").find("ytd-playlist-panel-video-renderer[selected]").prev();
                while (!elem.find("#unplayableText").prop("hidden")) { // while unplayable (e.g. private) video is selected
                    elem = elem.prev();
                }
                return elem.children()[0];
            } else {
                elem = $("#content").find("ytd-playlist-panel-video-renderer[selected]").prev();
                while (!elem.find("#unplayableText").prop("hidden")) { // while unplayable (e.g. private) video is selected
                    elem = elem.prev();
                }
                return elem.children()[0];
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
