// ==UserScript==
// @name         Hide Discord sidebars
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      1.0
// @description  Give the chat more screen space
// @author       Dragosarus
// @match        *discord.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';
    var hide = {
        serverSidebar : true,
        channelSidebar: true,
        memberSidebar : true
    };

    var serverSelector = "nav[aria-label='Servers sidebar']";
    var channelSelector = "div[class*='sidebar']";
    var memberSelector = "div[class*='membersWrap']";
    var baseSelector = "div[class*='base']";
    var hideMenu = "Hide sidebars";
    var showMenu = "Show sidebars";
    var menuShortcut = 's';

    var menuId;
    var baseOffset;

    var sidebarsHidden = false;
    var selectors = {
        serverSidebar: serverSelector,
        channelSidebar: channelSelector,
        memberSidebar: memberSelector
    };

    // Init
    menuId = GM_registerMenuCommand(hideMenu, onMenuClick, menuShortcut);

    function onMenuClick() {
        // Toggle visibility of sidebars
        for (var sidebar in selectors) {
            if (hide[sidebar]) {
                if (sidebarsHidden) {
                    showSidebar(selectors[sidebar]);
                } else {
                    hideSidebar(selectors[sidebar]);
                }
            }
        }

        // Extra work is needed to properly hide the server sidebar
        if (hide.serverSidebar) {
            var base = $(baseSelector);
            if (sidebarsHidden) {
                base.css("left", baseOffset);
            } else {
                baseOffset = base[0].style.left;
                base.css("left", "0px");
            }
        }

        sidebarsHidden ^= true; // toggle

        // Update menu
        GM_unregisterMenuCommand(menuId);
        var menu;
        if (sidebarsHidden) {
            menu = showMenu;
        } else {
            menu = hideMenu;
        }
        menuId = GM_registerMenuCommand(menu, onMenuClick, menuShortcut);
    }

    function hideSidebar(selector) {
        var node = $(selector)[0];
        node.style.display = "none";
    }

    function showSidebar(selector) {
        var node = $(selector)[0];
        node.style.removeProperty("display");
    }

})();
/*eslint-env jquery*/ // stop eslint from showing "'$' is not defined" warnings
