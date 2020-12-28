// ==UserScript==
// @name         Hide Discord sidebars
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      2.0
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
        memberSidebar : true // also adds 2nd button
    };

    var serverSelector = "nav[aria-label='Servers sidebar']";
    var channelSelector = "div[class*='sidebar']";
    var memberSelector = "div[class*='membersWrap']";
    var baseSelector = "div[class*='base']"; // needed when hiding server sidebar
    var chatSelector = "div[class*='chat']"; // needed for observer

    var hideMenu = "Hide sidebars";
    var showMenu = "Show sidebars";
    var memberToggleMenu = "Toggle member sidebar"; // + " [current: (in)visible]"
    var hideSidebarMenuShortcut = 's';
    var memberToggleMenuShortcut = 't';

    var hideSidebarMenuId;
    var memberToggleMenuId;
    var baseOffset; // e.g. "72px"

    var sidebarsHidden = false;
    var memberSidebarHidden = false; // overrides sidebarsHidden
    var selectors = {
        serverSidebar: serverSelector,
        channelSidebar: channelSelector,
        memberSidebar: memberSelector
    };

    const memberObserver = new MutationObserver(memberObserverCallback);
    const options = {attributes:true, childList:true};

    init();

    function init() {
        updateMemberToggleMenu(); // if hide.memberSidebar == true
        updateHideSidebarMenu();
    }

    // Called when switching servers/channels
    function memberObserverCallback() {
        setSidebar(memberSelector, !memberSidebarHidden);
    }

    function onMemberToggleMenuClick() {
        // (re-)activate observer
        memberObserver.observe($(chatSelector)[0], options);

        if (!(sidebarsHidden)) {
            setSidebar(memberSelector, memberSidebarHidden);
        }
        memberSidebarHidden ^= true;

        // Update menus (both of them to preserve order)
        updateMemberToggleMenu();
        updateHideSidebarMenu();
    }

    function onHideSidebarMenuClick() {
        // Toggle visibility of sidebars
        for (var sidebar in selectors) {
            // hideMemberSidebar = memberSidebarHidden || sidebarsHidden
            if (sidebar == "memberSidebar" && memberSidebarHidden) {continue;}

            if (hide[sidebar]) {
                setSidebar(selectors[sidebar], sidebarsHidden);
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
        sidebarsHidden ^= true;

        // Update menu
        updateHideSidebarMenu();
    }

    function updateMemberToggleMenu() {
        if (hide.memberSidebar) {
            GM_unregisterMenuCommand(memberToggleMenuId);
            var v = memberSidebarHidden ? "in" : "";
            memberToggleMenuId = GM_registerMenuCommand(memberToggleMenu + " [current: " + v + "visible]",
                                                        onMemberToggleMenuClick, memberToggleMenuShortcut);
        }
    }

    function updateHideSidebarMenu() {
        GM_unregisterMenuCommand(hideSidebarMenuId);
        var menu = sidebarsHidden ? showMenu : hideMenu;
        hideSidebarMenuId = GM_registerMenuCommand(menu, onHideSidebarMenuClick, hideSidebarMenuShortcut);
    }

    function setSidebar(selector, boolValue) {
        if (boolValue) {
            showSidebar(selector);
        } else {
            hideSidebar(selector);
        }
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
