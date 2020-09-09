// ==UserScript==
// @name         Disable Discord chat input
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      2.0
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

    const channelObserver = new MutationObserver(channelObserverCallback);
    const serverObserver = new MutationObserver(serverObserverCallback);
    const options = {childList:true, attributes:true};
    addObserver(serverObserver,"div[class*='content-']");
    addObserver(channelObserver,"div[class*='chat-']", disable);

    function serverObserverCallback(mutationList, observer) { // when changing servers
        //console.log("server callback");
        addObserver(channelObserver,"div[class*='chat-']", disable);
    }
    function channelObserverCallback(mutationList, observer) { // when changing channels
        //console.log("channel callback");
        disable();
    }

    function addObserver(observer, query, onSuccess = function(){}) {
        var q = $(query);
        if (!q.length) { setTimeout(function(){addObserver(observer, query, onSuccess)},100);}
        else {
            observer.observe(q[0], options);
            onSuccess();
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
})();
