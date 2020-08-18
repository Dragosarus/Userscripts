// ==UserScript==
// @name         Display remaining Youtube playlist time
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      1.0
// @description  Displays the sum of the lengths of the remaining videos in a playlist
// @author       Dragosarus
// @match        http*://www.youtube.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    /* Time formats:
     * 0: "x.xx hours" or "x.xx minutes" or "x seconds"
     * 1: xhxmxs (e.g 25m2s or 25m 2s)
     * 2: h:mm:ss (e.g 25:02 or 1:00:31 or 0:03)
    */
    var textformat = 1;

    var textformat0_decimalPlaces = 2;
    var textformat0_hourThreshold = 3600; // e.g "3.50" hours instead of "210.00 minutes" or "12600 seconds"
    var textformat0_minuteThreshold = 60; // e.g "2.50" minutes instead of "180.00 seconds"
    var textformat1_spacing = true; // e.g 1h 23m 2s instead of 1h23m2s
    var textformat1_forceFull = false; // e.g 0h3m2s instead of 3m2s, 3h0m50s instead of 3h50s, etc
    var textformat2_forceFull = false; // e.g 0:03:02 instead of 3:02

    var includeCurrentVideo = true; // whether the length of the current video should be included
    var before = " - "; // ::before
    var before_miniplayer = " • ";
    var updateCooldown = 2500; // limit how often update() is run (milliseconds)

    var updateFlagTime = 0;
    var time_total_s = 0;
    var errorFlag = false;
    var direction;

    const playlistObserver = new MutationObserver(observerCallback);
    const pytplirObserver = new MutationObserver(pytplirCallback);
    const observerOptions = {subtree:true, childList:true, attributes:true, characterData:true};
    initObservers(playlistObserver);

    setInterval(check, updateCooldown);


    function observerCallback(mutationList, observer) {
       update();
    }
    function pytplirCallback(mutationList, observer) {
       update(true); // force update regardless of cooldown
    }

    function initObservers(observer) {
        try {
            observer.observe($(".ytd-watch-flexy #playlist").find("#publisher-container")[0], observerOptions);
            observer.observe($("yt-formatted-string[id=owner-name]")[0], observerOptions); // miniplayer
        } catch (e) {
            setTimeout(function(){initObservers(observer)},100);
        }
    }

    function check() {
        if (!$("#drypt_label").length || ($("ytd-app")[0].hasAttribute("miniplayer-active_") && !$("#drypt_label_miniplayer").length)) {
            update();
        }
        if ($("#pytplir_btn").length) {
            pytplirObserver.observe($("#pytplir_btn")[0],{attributes:true});
        }

    }

    function update(force=false) {
        if (Date.now() - updateFlagTime < updateCooldown && !force) {
            return;
        }

        updateFlagTime = Date.now();
        direction = getDirection();
        var playlistEntry = getCurrentEntry();
        if (!playlistEntry) {return;}

        if (!includeCurrentVideo) {
            playlistEntry = getNextEntry(playlistEntry);
        }
        time_total_s = 0;
        if (playlistEntry){
            addTime(playlistEntry);
        }
        if (!errorFlag){
            display();
        } else {
            setTimeout(update,100);
            errorFlag = false;
        }
    }

    function getCurrentEntry(){ // returns <ytd-playlist-panel-video-renderer> element
        var elem;
        try {
            if ($("ytd-app")[0].hasAttribute("miniplayer-active_")) {
                return $("div.miniplayer").find("ytd-playlist-panel-video-renderer[selected]")[0];
            } else {
                return $("#content").find("ytd-playlist-panel-video-renderer[selected]")[0];
            }
        } catch (e) {
            errorFlag = true;
        }
    }

    function getNextEntry(current){
        if (direction) { // pytplir
            current = $(current).prev();
        } else {
            current = $(current).next();
        }
        if (current.length) {
            if (!current.find("#unplayableText").prop("hidden")) {
                return getNextEntry(current);
            } else {
                return current[0];
            }
        } else {
            return undefined;
        }
    }

    function getVidNum() {
        var vidNum_tmp;
        if ($("ytd-app")[0].hasAttribute("miniplayer-active_")) {
            vidNum_tmp = $("yt-formatted-string[id=owner-name").children()[2].innerHTML;
        } else {
            vidNum_tmp = $("#publisher-container").find("span")[1].innerHTML + "/"; // apparently this is e.g "1" in Firefox, but "1 / n" in Chrome
        }
        return $.trim(vidNum_tmp.substring(0,vidNum_tmp.indexOf("/")));
    }

    function getDirection(){ // Compatible with https://greasyfork.org/en/scripts/404986-play-youtube-playlist-in-reverse-order
        var pytplir_btn = $("#pytplir_btn");
        if (!pytplir_btn.length) {
            return 0; // down
        } else {
            return pytplir_btn.attr("activated") == "true" ? 1 : 0;
        }
    }

    function addTime(entry) {
        var time_raw = getTime(entry);
        if (time_raw != "-1") {
            time_total_s += hmsToSecondsOnly(time_raw);
            entry = getNextEntry(entry);
            if (entry) {
                addTime(entry);
            }
        } else {
            errorFlag = true;
        }
    }

    function getTime(item) {
        var unavailable = !$(item).find("#unplayableText").prop("hidden");
        if (!unavailable) {
            var time = $(item).find("span.ytd-thumbnail-overlay-time-status-renderer");
            if (!time.length) {// timestamp has not been loaded yet
                return "-1";
            } else {
                return $.trim(time[0].innerHTML);
            }
        } else { // unwatchable video => no timestamp
            return "0";
        }
    }

    // https://stackoverflow.com/questions/9640266/convert-hhmmss-string-to-seconds-only-in-javascript
    function hmsToSecondsOnly(str) {
        var p = str.split(':'),
            s = 0, m = 1;

        while (p.length > 0) {
            s += m * parseInt(p.pop(), 10);
            m *= 60;
        }

        return s;
    }

    function display() {
        var text = formatTime(time_total_s);
        if (text == "") {return;} // this is apparently possible
        if (!$("ytd-app")[0].hasAttribute("miniplayer-active_")) {
            if (!$("#drypt_label").length) {
                var label = document.createElement("a");
                var textColor = "rgb(237,240,243)";
                label.setAttribute("font-family","Roboto, Noto, sans-serif");
                label.setAttribute("font-size","13px");
                label.setAttribute("fill",textColor);
                label.setAttribute("id","drypt_label");
                $("div.index-message-wrapper")[0].appendChild(label);
            }
            $("#drypt_label")[0].innerHTML = before + "(" + text + " left)";

        } else { // miniplayer
            if (!$("#drypt_label_miniplayer").length) {
                var label_miniplayer = document.createElement("a");
                label_miniplayer.setAttribute("font-family","Roboto, Noto, sans-serif");
                label_miniplayer.setAttribute("font-size","13px");
                label_miniplayer.setAttribute("fill",textColor);
                label_miniplayer.setAttribute("id","drypt_label_miniplayer");
                $("yt-formatted-string[id=owner-name]")[0].appendChild(label_miniplayer);
            }
            $("#drypt_label_miniplayer")[0].innerHTML = before_miniplayer + "(" + text + " left)";
        }
    }

    function formatTime(time_total_s) {
        var formats = [formatTime0, formatTime1, formatTime2];
        if (textformat > formats.length || textformat < 0) {
            textformat = 0;
        }
        return formats[textformat](time_total_s);
    }

    function formatTime0(time_total_s) { // "x.xx hours" OR "x.xx minutes" OR "x seconds"
        if (time_total_s >= textformat0_hourThreshold) {
            return (time_total_s / textformat0_hourThreshold).toFixed(textformat0_decimalPlaces) + " hours";
        } else if (time_total_s >= textformat0_minuteThreshold) {
            return (time_total_s / textformat0_minuteThreshold).toFixed(textformat0_decimalPlaces) + " minutes";
        } else {
            return time_total_s + " seconds";
        }
    }

    function formatTime1(time_total_s) { // xhxmxs (e.g 25m2s or 25m 2s)
        var space = textformat1_spacing ? " " : "";
        var hh = Math.floor(time_total_s / 3600);
        var mm = Math.floor((time_total_s % 3600) / 60);
        var ss = time_total_s % 60;

        var text = "";
        if (hh > 0 || textformat1_forceFull) {
            text += hh + "h" + space;
        };
        if (mm > 0 || textformat1_forceFull) {
            text += mm + "m" + space;
        };
        if (ss > 0 || textformat1_forceFull || !time_total_s) {
            text += ss + "s";
        };
        return text;
    }

    function formatTime2(time_total_s) { // h:mm:ss (e.g 25:02 or 1:00:31 or 0:03)
        var hh = Math.floor(time_total_s / 3600);
        var mm = Math.floor((time_total_s % 3600) / 60);
        var ss = time_total_s % 60;

        var text = "";
        if (hh > 0 || textformat2_forceFull) {
            text += hh + ":";
        }
        if (hh > 0 && mm > 0) { // 1:01:22
            if (mm < 10) {text += "0";}
        }
        text += mm + ":";
        if (ss < 10) {text += "0"}
        text += ss;
        return text;
    }

})();
