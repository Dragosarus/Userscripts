// ==UserScript==
// @name         Display remaining Youtube playlist time
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      3.3
// @description  Displays the sum of the lengths of the remaining videos in a playlist
// @author       Dragosarus
// @match        http://www.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @noframes
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    /* Time formats:
     * 0: "x.xx hours" or "x.xx minutes" or "x seconds"
     * 1: xhxmxs (e.g 25m2s or 25m 2s)
     * 2: h:mm:ss (e.g 25:02 or 1:00:31 or 0:03)
    */
    const showTime = true;
    const timeFormat = 1;

    /* Percentage formats:
     * 0: % watched (e.g. [42% done])
     * 1: % remaining (e.g. [58% left])
    */
    const showPercentage = false; // e.g. [42% done] (will be shown to the right of the time)
    const percentageFormat = 0;

    /* true: The duration of the current video is ignored when determining the time left
     * false: The duration of the current video is added when determining the time left
    */
    const treatCurrentVideoAsWatched = false;

    const timeFormat0_decimalPlaces = 2;
    const timeFormat0_hourThreshold = 3600; // e.g "3.50" hours instead of "210.00 minutes" or "12600 seconds"
    const timeFormat0_minuteThreshold = 60; // e.g "2.50" minutes instead of "150 seconds"
    const timeFormat1_spacing = true; // e.g 1h 23m 2s instead of 1h23m2s
    const timeFormat1_forceFull = false; // e.g 0h3m2s instead of 3m2s, 3h0m50s instead of 3h50s, etc
    const timeFormat2_forceFull = false; // e.g 0:03:02 instead of 3:02

    const before = " - "; // ::before
    const before_miniplayer = " • ";
    const updateCooldown = 2500; // limit how often update() is run (milliseconds)

    const time_after = " left) "; // e.g "15h 20m 15s left)"
    const incompleteIndicator_time = "(>"; // e.g "(>15h 20m 15s left)", for large playlists (> 200 videos)
    const completeIndicator_time = "("; // e.g "(15h 20m 15s left)"

    const percentageFormat0_after = "% done]";
    const percentageFormat1_after = "% left]";
    const incompleteIndicator_percentage = " [~"; // e.g "(10s left) [~20% done]", for large playlists (> 200 videos)
    const completeIndicator_percentage = " ["; // e.g "(10s left) [20% done]"
    const percentage_decimalPlaces = 1;
    const percentage_after = [percentageFormat0_after, percentageFormat1_after];


    const DOWN = false; // direction
    const UP = true; // direction
    var updateFlagTime = 0;
    var time_total_s = 0;
    var time_total_s_elapsed = 0; // stores duration of previous videos
    var direction_global = DOWN;
    var errorFlag = false;
    var incompleteFlag = false; // A playlist only displays the 199 previous+next entries in the playlist.
    var incompleteFlagR = false; // Used to determine if the percentage is accurate; checks the direction opposite to direction_global
    var miniplayerActive = false;

    const selectors = {
        "currentVideo": "#content ytd-playlist-panel-video-renderer[selected]",
        "currentVideo_miniplayer": "div.miniplayer ytd-playlist-panel-video-renderer[selected]",
        "drypt_label": "#drypt_label", // created by this script
        "drypt_label_miniplayer": "#drypt_label_miniplayer", // created by this script
        "playlistHeaderText": "div.index-message-wrapper",
        "pytplir_btn": "#pytplir_btn", // https://greasyfork.org/en/scripts/404986-play-youtube-playlist-in-reverse-order
        "timestamp": "span.ytd-thumbnail-overlay-time-status-renderer",
        "unplayableText": "#unplayableText",
        "vidCount": ".ytd-watch-flexy #playlist #publisher-container div yt-formatted-string",
        "vidCount_miniplayer": "yt-formatted-string[id=owner-name] :nth-child(3)",
        "vidNum": "#publisher-container span.index-message",
        "vidNum_miniplayer": "yt-formatted-string[id=owner-name]",
        "ytd_app": "ytd-app"
    };

    const playlistObserver = new MutationObserver(observerCallback);
    const pytplirObserver = new MutationObserver(pytplirCallback);
    const observerOptions = {attributes:true, characterData:true};

    initObservers(playlistObserver);
    setInterval(check, updateCooldown); // init; then ensure the pytplir button is detected correctly

    function observerCallback(mutationList, observer) {
       update();
    }
    function pytplirCallback(mutationList, observer) {
       update(true); // force update regardless of cooldown
    }

    function initObservers(observer) {
        try {
            observer.observe($(selectors.vidCount)[0], observerOptions);
            observer.observe($(selectors.vidCount_miniplayer)[0], observerOptions); // miniplayer
        } catch (e) {
            setTimeout(function(){initObservers(observer)},100);
        }
    }

    function check() {
        if (!$(selectors.drypt_label).length || (miniplayerActive && !$(selectors.drypt_label_miniplayer).length)) {
            update();
        }
        if ($(selectors.pytplir_btn).length) {
            pytplirObserver.observe($(selectors.pytplir_btn)[0],{attributes:true});
        }

    }

    function update(force=false) {
        var timeSinceUpdate = Date.now() - updateFlagTime;
        if (timeSinceUpdate < updateCooldown && !force) {
            setTimeout(update, updateCooldown - timeSinceUpdate);
            return;
        }

        updateFlagTime = Date.now();
        miniplayerActive = $(selectors.ytd_app)[0].hasAttribute("miniplayer-active_") || $(selectors.ytd_app)[0].hasAttribute("miniplayer-active");
        var playlistEntry = getCurrentEntry();
        if (!playlistEntry) {return;}

        direction_global = getDirection();
        incompleteFlag = false;
        incompleteFlagR = false;
        if (treatCurrentVideoAsWatched) {
            playlistEntry = getNextEntry(playlistEntry, direction_global);
        }

        time_total_s = 0;
        time_total_s_elapsed = 0;
        if (playlistEntry) {
            addTime(playlistEntry, direction_global);
            if (showPercentage) { // also need to sum the video durations in the other direction
                var next = getNextEntry(playlistEntry,!direction_global);
                if (next) {
                    addTime(next, !direction_global);
                }
            }
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
            if (miniplayerActive) {
                return $(selectors.currentVideo_miniplayer)[0];
            } else {
                return $(selectors.currentVideo)[0];
            }
        } catch (e) {
            errorFlag = true;
        }
    }

    function getNextEntry(current, direction){
        var previous = current;
        if (direction) {
            current = $(current).prev();
        } else {
            current = $(current).next();
        }
        if (current.length) {
            if (!current.find(selectors.unplayableText).prop("hidden")) {
                return getNextEntry(current, direction);
            } else {
                return current[0];
            }
        } else {
            checkIncomplete(previous, direction);
            return undefined;
        }
    }

    function checkIncomplete(entry, direction) {
        var vidNums = getVidNum();
        var num = parseInt($(entry).find("#index")[0].innerHTML);
        var currentVideo = isNaN(num) // ▶ instead of number
        if (!currentVideo){ // current video is neither the first nor the last video in the playlist
            if (direction == direction_global) {
                incompleteFlag = (direction_global == DOWN && num != vidNums[1]) || (direction_global == UP && num != 1);
            } else {
                incompleteFlagR = (direction_global == UP && num != vidNums[1]) || (direction_global == DOWN && num != 1);
            }
        }
    }

    function getVidNum() { // returns integer array [current, total], e.g "32 / 152" => [32,152]
        var vidNum_tmp;
        if (miniplayerActive) {
            vidNum_tmp = $(selectors.vidNum_miniplayer).children()[2].innerHTML;
        } else {
            vidNum_tmp = $(selectors.vidNum)[0].innerHTML;
        }
        return vidNum_tmp.split(" / ").map(x => parseInt(x));
    }

    function getDirection(){ // Compatible with https://greasyfork.org/en/scripts/404986-play-youtube-playlist-in-reverse-order
        var pytplir_btn = $(selectors.pytplir_btn);
        if (!pytplir_btn.length) {
            return DOWN;
        } else {
            return pytplir_btn.attr("activated") == "true" ? UP : DOWN;
        }
    }

    function addTime(entry, direction) {
        var time_raw = getTime(entry);
        if (time_raw != "-1") {
            if (direction == direction_global){
                time_total_s += hmsToSecondsOnly(time_raw);
            } else { // in order to calculate % done/remaining
                time_total_s_elapsed += hmsToSecondsOnly(time_raw);
            }
            entry = getNextEntry(entry, direction);
            if (entry) {
                addTime(entry, direction);
            }
        } else {
            errorFlag = true;
        }
    }

    function getTime(item) {
        var unavailable = !$(item).find(selectors.unplayableText).prop("hidden");
        if (!unavailable) {
            var time = $(item).find(selectors.timestamp);
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

        if (isNaN(s)) { // Likely caused by premiere video
            return 0;
        }

        return s;
    }

    function display() {
        var time = formatTime(time_total_s);
        if (time == "") {return;} // this is apparently possible
        var timeString = "";
        if (showTime) {
            var time_before = incompleteFlag ? incompleteIndicator_time : completeIndicator_time; // e.g "(more than " or "( "
            timeString = time_before + time + time_after;
        }

        var percentageString = "";
        if (showPercentage) {
            var missingData = incompleteFlag || incompleteFlagR; // due to large playlist
            var percentage_before = missingData ? incompleteIndicator_percentage : completeIndicator_percentage;
            var playlistTime = time_total_s + time_total_s_elapsed;
            var percentage;
            switch (percentageFormat) { // determine numerator
                case 0: // show % watched
                    percentage = time_total_s_elapsed;
                    break;
                case 1: // show % remaining
                    percentage = time_total_s;
                    break;
            }
            if (playlistTime != 0){
                percentage = 100 * percentage / playlistTime;
                if (!Number.isInteger(percentage)) {
                    percentage = percentage.toFixed(percentage_decimalPlaces);
                }
            } else { // treatCurrentVideoAsWatched == true and current video is first/last in playlist
                percentage = percentageFormat ? 0 : 100;
            }
            percentageString = percentage_before + percentage + percentage_after[percentageFormat];
        }

        if (!miniplayerActive) {
            if (!$(selectors.drypt_label).length) {
                var label = document.createElement("a");
                var textColor = "rgb(237,240,243)";
                label.setAttribute("font-family","Roboto, Noto, sans-serif");
                label.setAttribute("font-size","13px");
                label.setAttribute("fill",textColor);
                label.setAttribute("id","drypt_label");
                $(selectors.playlistHeaderText).filter(":visible")[0].appendChild(label);
            }
            $(selectors.drypt_label)[0].innerHTML = before + timeString + percentageString;

        } else { // miniplayer
            if (!$(selectors.drypt_label_miniplayer).length) {
                var label_miniplayer = document.createElement("a");
                label_miniplayer.setAttribute("font-family","Roboto, Noto, sans-serif");
                label_miniplayer.setAttribute("font-size","13px");
                label_miniplayer.setAttribute("fill",textColor);
                label_miniplayer.setAttribute("id","drypt_label_miniplayer");
                $(selectors.vidNum_miniplayer)[0].appendChild(label_miniplayer);
            }
            $(selectors.drypt_label_miniplayer)[0].innerHTML = before_miniplayer + timeString + percentageString;
        }
        incompleteFlag = false;
    }

    function formatTime(time_total_s) {
        var formats = [formatTime0, formatTime1, formatTime2];
        if (timeFormat > formats.length || timeFormat < 0) {
            timeFormat = 0;
        }
        return formats[timeFormat](time_total_s);
    }

    function formatTime0(time_total_s) { // "x.xx hours" OR "x.xx minutes" OR "x seconds"
        if (time_total_s >= timeFormat0_hourThreshold) {
            return (time_total_s / 3600).toFixed(timeFormat0_decimalPlaces) + " hours";
        } else if (time_total_s >= timeFormat0_minuteThreshold) {
            return (time_total_s / 60).toFixed(timeFormat0_decimalPlaces) + " minutes";
        } else {
            return time_total_s + " seconds";
        }
    }

    function formatTime1(time_total_s) { // xhxmxs (e.g 25m2s or 25m 2s)
        var space = timeFormat1_spacing ? " " : "";
        var hh = Math.floor(time_total_s / 3600);
        var mm = Math.floor((time_total_s % 3600) / 60);
        var ss = time_total_s % 60;

        var text = "";
        if (hh > 0 || timeFormat1_forceFull) {
            text += hh + "h" + space;
        };
        if (mm > 0 || timeFormat1_forceFull) {
            text += mm + "m" + space;
        };
        if (ss > 0 || timeFormat1_forceFull || !time_total_s) {
            text += ss + "s";
        };
        return text;
    }

    function formatTime2(time_total_s) { // h:mm:ss (e.g 25:02 or 1:00:31 or 0:03)
        var hh = Math.floor(time_total_s / 3600);
        var mm = Math.floor((time_total_s % 3600) / 60);
        var ss = time_total_s % 60;

        var text = "";
        if (hh > 0 || timeFormat2_forceFull) {
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
/*eslint-env jquery*/ // stop eslint from showing "'$' is not defined" warnings
