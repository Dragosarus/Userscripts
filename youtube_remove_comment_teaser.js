// ==UserScript==
// @name         Remove the Youtube comment teaser
// @namespace    https://github.com/Dragosarus/Userscripts/
// @version      1.0
// @description  Undo part of YT's new UI change
// @author       Dragosarus
// @match        http://www.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @noframes
// ==/UserScript==

// NOTE: For e.g. uBlock users, the same effect can be achieved by adding "www.youtube.com###comment-teaser" to your filter list.

(function() {
    'use strict';

    removeCommentTeaser();

    function removeCommentTeaser() {
        var node = document.getElementById("comment-teaser");
        if (node != null) {
            node.remove();
        } else {
            setTimeout(removeCommentTeaser, 5000);
        }
    }
})();
