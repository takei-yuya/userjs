// ==UserScript==
// @name LinkTag
// @author TAKEI Yuya
// @version 0.0
// @namespace hatena/goth_wrist_cut
// ==/UserScript==

(function () {

	function linktag() {
		var anchers = document.getElementsByTagName("a");
		for (var ancher in anchers) {
			var href = ancher.href;
			if (/\.jpeg$/.match(href) || /\.jpg$/.match(href) || /\.jpe$/.match(href)) {
				if (ancher.title == undefined || ancher.title == "") {
					ancher.title = "[jpg]" + ancher.innerText;
				} else {
					ancher.title = "[jpg]" + ancher.title;
				}
			} else if(/\.gif$/.match(href)) {
				if (ancher.title == undefined || ancher.title == "") {
					ancher.title = "[gif]" + ancher.innerText;
				} else {
					ancher.title = "[gif]" + ancher.title;
				}
			} else if(/\.png$/.match(href)) {
				if (ancher.title == undefined || ancher.title == "") {
					ancher.title = "[png]" + ancher.innerText;
				} else {
					ancher.title = "[png]" + ancher.title;
				}
			}
		}
	}

	window.addEventListener("load", function () { linktag(); }, false);
})();
