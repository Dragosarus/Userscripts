// ==UserScript==
// @name         Disable Discord chat input
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      1.0
// @description  Avoid accidentally typing in chat
// @author       Dragosarus
// @match        *discord.com/channels/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var disableTextArea = true;
    var menuId = GM_registerMenuCommand("Toggle (on)", toggle, 't');

    const observer = new MutationObserver(observerCallback);
    const options = {childList:true};
    init();

    function observerCallback(mutationList, observer) {
        disable();
    }

    function init() {
        var chat = $("div[class*='chat']");
        if (!chat.length) { setTimeout(init,100);}
        else {
            observer.observe(chat[0], options);
            disable();
        }
    }

    function toggle() {
        disableTextArea ^= true;
        if (disableTextArea) {
            GM_unregisterMenuCommand(menuId);
            menuId = GM_registerMenuCommand("Toggle (currently ON)", toggle, 't');
            disable();
        } else {
            GM_unregisterMenuCommand(menuId);
            menuId = GM_registerMenuCommand("Toggle (currently OFF)", toggle, 't');
            enable();
        }
    }

    function disable() {
        if (disableTextArea) {
            //console.log("disabled!");
            var textareaQuery = $("div[class*='slateTextArea']");
            textareaQuery.attr("contenteditable","false");
            textareaQuery[0].style.removeProperty("-webkit-user-modify"); // needed for Chrome
            textareaQuery.parent().parent()[0].style.setProperty("pointer-events","none"); // disable mouse events
        }
    }

    function enable() {
        var textareaQuery = $("div[class*='slateTextArea']");
        textareaQuery.attr("contenteditable","true");
        textareaQuery[0].style.setProperty("-webkit-user-modify", "read-write-plaintext-only");
        textareaQuery.parent().parent()[0].style.removeProperty("pointer-events");
    }
})();
