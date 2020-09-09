// ==UserScript==
// @name         Disable Discord chat input
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      3.0
// @description  Avoid accidentally typing in chat
// @author       Dragosarus
// @match        *discord.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    // Modes (use menu to cycle between these):
    // "hover": Enable chat input only when the cursor is hovering over it
    // "strict": Disables chat input completely
    // "off": Keep chat input enabled.
    var modes = ["hover","strict", "off"];
    var modeIndex = modes.length-1;
    var menuShortcut = 'm';
    var menuId;
    switchMode(); // default: hover

    const channelObserver = new MutationObserver(channelObserverCallback);
    const serverObserver = new MutationObserver(serverObserverCallback);
    const options = {childList:true, attributes:true};
    addObserver(serverObserver,"div[class*='content-']");
    serverObserverCallback(); // init

    function serverObserverCallback(mutationList, observer) { // when changing servers
        //console.log("server callback");
        addObserver(channelObserver,"div[class*='chat-']", disable);
        addHoverFunc();
    }
    function channelObserverCallback(mutationList, observer) { // when changing channels
        //console.log("channel callback");
        disable();
        addHoverFunc();
    }

    function addObserver(observer, query, onSuccess = function(){}) {
        var q = $(query);
        if (!q.length) { setTimeout(function(){addObserver(observer, query, onSuccess)},100);}
        else {
            observer.observe(q[0], options);
            onSuccess();
        }
    }

    function switchMode() {
        modeIndex = (modeIndex + 1) % modes.length;
        GM_unregisterMenuCommand(menuId);
        menuId = GM_registerMenuCommand("Switch mode [current: " + modes[modeIndex] + "]", switchMode, menuShortcut);
        switch (modes[modeIndex]){
            case "hover":
            case "strict":
                disable();
                break;
            case "off":
                enable();
                break;
        }
    }

    function disable() {
        if (modes[modeIndex] != "off") {
            //console.log("disabled!");
            var textareaQuery = $("div[class*='slateTextArea']");
            if (textareaQuery.length) {
                textareaQuery.attr("contenteditable","false");
                textareaQuery[0].style.removeProperty("-webkit-user-modify"); // needed for Chrome
                textareaQuery.parent().parent()[0].style.setProperty("pointer-events","none"); // disable mouse events
            } else {
                setTimeout(disable,100);
            }
        }
    }

    function enable() {
        var textareaQuery = $("div[class*='slateTextArea']");
        if (textareaQuery.length) {
            textareaQuery.attr("contenteditable","true");
            textareaQuery[0].style.setProperty("-webkit-user-modify", "read-write-plaintext-only");
            textareaQuery.parent().parent()[0].style.removeProperty("pointer-events");
        } else {
            setTimeout(enable,100);
        }
    }

    function addHoverFunc() {
        var textareaQuery = $("div[class*='scrollableContainer']");
        if (textareaQuery.length) {
            textareaQuery.hover(hoverEnter, hoverExit);
        } else {
            setTimeout(addHoverFunc,100);
        }
    }

    function hoverEnter() {
        if (modes[modeIndex] == "hover"){
            enable();
        }
    }

    function hoverExit() {
        if (modes[modeIndex] == "hover"){
            disable();
        }
    }

})();
