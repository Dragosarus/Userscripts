// ==UserScript==
// @name         Play Youtube playlist in reverse order
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      1.0
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

        var player;
        var arrow_up;
        var arrow_down;
        var playPrevious;
        var btn_svg;
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
            arrow_up = document.createElementNS("http://www.w3.org/2000/svg","polygon");
            arrow_down = document.createElementNS("http://www.w3.org/2000/svg","polygon");
            btn_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");

            arrow_up.setAttribute("points","26,19 26,17 22,17 29,11 36,17 32,17 32,19");
            arrow_up.addEventListener("click",onButtonClick);
            arrow_down.setAttribute("points","26,20 26,22 22,22 29,28 36,22 32,22 32,20");
            arrow_down.addEventListener("click",onButtonClick);
            btn_svg.setAttribute("viewbox","0 0 40 40");
            btn_svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
            btn_svg.setAttribute("width","50");
            btn_svg.setAttribute("height","40");
            btn_svg.setAttribute("id","plst-rev-btn");
            btn_svg.appendChild(arrow_up);
            btn_svg.appendChild(arrow_down);

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
                if (!document.getElementById("plst-rev-btn")) {
                    res[0].appendChild(btn_svg);
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
