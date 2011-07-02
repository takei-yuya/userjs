// ==UserScript==
// @name          AutoLinker
// @author        TAKEI Yuya
// @version       0.0
// @namespace     hatena/goth_wrist_cut
// ==/UserScript==

(function (){
	// site_rules:
	// サイトごとに{url: URLパターン, rules: ルール}の配列。最初にマッチしたものだけを使う。
	// ルールは{rel: relの値, patterns: 条件}の配列で、すべてのリンクのそれぞれ条件で一致検査される。
	// 条件は{elementの属性/プロパティ: パターン}。複数指定した場合にはすべてマッチしたときだけ使われる。
	//  classはclassNameを使う必要があるほか、"."区切りで連結できる。i
	//  その場合にはクォートで囲む必要アリ(ex: { patterns: 'parentNode.innerText': /最新→/ } など)
	// パターンは基本的に部分一致なので、完全一致させたい場合には^と$を使う。
	var site_rules = [
	{
		url: /google\.(co\.jp|com)/,
		rules:
			[
			{ rel: "home",  patterns: {id: /logo/}, },
			{ rel: "first", patterns: {className: /^fl$/, href: /start=0/}, },
			{ rel: "prev",  patterns: {className: /^pn$/, id: /^pnprev$/}, },
			{ rel: "next",  patterns: {className: /^pn$/, id: /^pnnext$/}, },
			],
	},
	{
		url: /search\.goo\.ne\.jp/,
		rules:
			[
			{ rel: "first", patterns: {'parentNode.parentNode.className': /^paging$/, innerText: /^1$/}, },
			{ rel: "prev",  patterns: {'parentNode.className': /^paging$/, innerText: /←前へ/}, },
			{ rel: "next",  patterns: {'parentNode.className': /^paging$/, innerText: /次へ→/}, },
			],
	},
	{
		url: /mixi\.jp/,
		rules:
			[
			{ rel: "home",  patterns: {id: /^pagetop$/}, },
			{ rel: "prev",  patterns: {innerText: /前の日記/}, },
			{ rel: "next",  patterns: {innerText: /次の日記/}, },
			{ rel: "index", patterns: {innerText: /<< .*さんの日記一覧へ/}, },
			{ rel: "contents", patterns: {innerText: /<< .*さんの日記一覧へ/}, },
			],
	},
	{
		url: /(www\.)?gahako\.com/,
		rules:
			[
			{ rel: "prev",     patterns: {innerHTML: /^←$/}, },
			{ rel: "next",     patterns: {innerHTML: /^→$/}, },
			{ rel: "contents", patterns: {innerHTML: /^●$/}, },
			{ rel: "index",    patterns: {innerHTML: /^●$/}, },
			{ rel: "up",       patterns: {innerHTML: /^●$/}, },
			{ rel: "first",    patterns: {innerHTML: /第一話に直接行く/}, },
			{ rel: "last",     patterns: {'parentNode.innerText': /最新→/}, },
			{ rel: "home",     patterns: {innerHTML: /→TOP(へ|に)(もど|戻)る/}, },
			],
	},
	{
		url: /oekakibbs\.com/,
		rules:
			[
			{ rel: 'first', patterns: {innerText: /\[1\]/}, },
			{ rel: 'prev',  patterns: {innerText: /\[前の[0-9]*件\]/}, },
			{ rel: 'next',  patterns: {innerText: /\[次の[0-9]*件\]/}, },
			],
	},
	{
		url: /./, // 汎用。FIXME: 地味に暴発することアリ。
		rules:
			[
			{ rel: 'contents', patterns: {rel: /contents/}, },
			{ rel: 'up',       patterns: {rel: /up/}, },
			{ rel: 'prev',     patterns: {rel: /prev/}, },
			{ rel: 'next',     patterns: {rel: /next/}, },
			{ rel: 'first',    patterns: {rel: /first/}, },
			{ rel: 'last',     patterns: {rel: /last/}, },
			{ rel: 'alternate',patterns: {rel: /英語版/}, }, // TODO: hreflangを処理したい。
			{ rel: 'contents', patterns: {innerHTML: /\b(サイトマップ|sitemap|目次|index)\b/}, },
			{ rel: 'home',     patterns: {innerHTML: /\b(トップ|top|ホーム|home)\b/}, },
			{ rel: 'prev',     patterns: {innerHTML: /(前の(ページ|.*へ|[0-9*]件))/}, },
			{ rel: 'next',     patterns: {innerHTML: /(次の(ページ|.*へ|[0-9*]件))/}, },
			{ rel: 'prev',     patterns: {innerHTML: /\b(prev|←|<<|&#171;)\b/}, },
			{ rel: 'next',     patterns: {innerHTML: /\b(next|→|>>|&#187;)\b/}, },
			{ rel: 'up',       patterns: {innerHTML: /(上へ|親ディレクトリ)/}, },
			{ rel: 'up',       patterns: {innerHTML: /\b(up|parent)\b/}, },
			],
	},
	];

	// link要素の動的追加。
	function make_link(rel, ancher) {
		var links = document.getElementsByTagName("link");
		for (var iLink = 0; iLink < links.length; ++iLink) {
			if (rel == links[iLink].getAttribute("rel")) {
				// すでにある場合には追加しない。
				return false;
			}
		}

		// link要素の追加
		var link = document.createElement("link");
		link.setAttribute("rel", rel);
		link.href = ancher.href;
		link.title = ancher.href;
		document.getElementsByTagName("head")[0].appendChild(link);

		// ancher要素のtitleにrelを追加する。
		// Operaならリンクパネルからどのancherがlinkになったかが確認できて便利(カモ)。
		if (ancher.title == undefined || ancher.title == "") {
			ancher.title = "[" + rel + "]" + ancher.innerText;
		} else {
			ancher.title = "[" + rel + "]" + ancher.title;
		}
		return true;
	}

	// ancher要素との一致検査
	function is_match(ancher, patterns) {
		// patternsのすべてに一致でTrue
		for (var attr in patterns) {
			var attrs = attr.split(".");
			var object = ancher;
			for (var i = 0; i < attrs.length && object != undefined; ++i) {
				object = object[attrs[i]];
			}
			if (object == undefined || !object.match(patterns[attr])) {
				return false;
			}
		}
		return true;
	}

	function autolink() {
		var anchers = document.getElementsByTagName("a");
		for (var iSiteRule = 0; iSiteRule < site_rules.length; ++iSiteRule) {
			var site_rule = site_rules[iSiteRule];
			var url = site_rule.url;
			var rules = site_rule.rules;
			if (document.location.href.match(url)) {
				// MEMO: 逆順で探した方が精度がよいかも？ もしくは先頭/末尾からn個のリンクとか。
				for (var iAncher = 0; iAncher < anchers.length; ++iAncher) {
					for (var iRule = 0; iRule < rules.length; ++iRule) {
						var ancher = anchers[iAncher];
						var rule = rules[iRule];
						var rel = rule.rel;
						var pat = rule.patterns;
						if (is_match(ancher, pat)) {
							make_link(rel, ancher);
						}
					} // for iRule in rules
				} // for iAncher in anchers
				break; // 最初にマッチしたサイトルールだけを使う。
			} // if href.match(href)
		} // for iSiteRule in site_rules
	}

	window.addEventListener("load", function () { autolink(); }, false);

	// URLに数字が含まれている場合には増減させてprev/nextを生成してみる。
	// FIXME: 誤作動多め。サイトごとパターンを指定できるといい感じ？名前付きキャプションほしいなぁ。
//	{
//		// basenameの拡張子前が数字だったら連番ページと見なす。 ex: hoge12.html
//		var num_url_pattern = /^(.*)([0-9]+)(\.[^\/]*)$/;
//		function incr(all, pre, pat, post) {
//			return pre + (parseInt(pat) + 1) + post;
//		}
//		function decr(all, pre, pat, post) {
//			return pre + (parseInt(pat) - 1) + post;
//		}
//		if (document.location.href.match(num_url_pattern)) {
//			var prev_ancher = document.createElement("a");
//			prev_ancher.innerHTML = "Prev";
//			prev_ancher.href = document.location.href.replace(num_url_pattern, decr);
//			make_link("prev", prev_ancher);
//			var next_ancher = document.createElement("a");
//			next_ancher.innerHTML = "Next";
//			next_ancher.href = document.location.href.replace(num_url_pattern, incr);
//			make_link("next", next_ancher);
//			alert(prev_ancher.href);
//		}
//	}
})();

