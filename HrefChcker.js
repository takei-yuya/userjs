// ==UserScript==
// @name          HrefChecker
// @author        TAKEI Yuya
// @version       0.0
// @namespace     hatena/goth_wrist_cut
// ==/UserScript==

(function () {
	var anchers = document.getElementsByTagName("a");
	for (var i = 0; i < anchers.length; ++i) {
		if (/^http:/.match(anchers[i].innerText)) {
			alert("URL like link");
			if (anchers[i].innerText != anchers[i].href) {
				alert("Ancher text and href are mismatch. '" + anchers[i].innerText + "' and '" + anchers[i].href + "'");
			}
		}
	}
})();
