var data = require("sdk/self").data;
var cm = require("sdk/context-menu");
var tabs = require("sdk/tabs");
var preferences = require("sdk/simple-prefs");
var pageMod1 = require("sdk/page-mod");
var pageMod2 = require("sdk/page-mod");

var selword = ""; // initialize selected word
var selindex = preferences.prefs["use-dic"]; // index of dictionary to use
var tabisalreadyopen = false;
var workerdictframes = null;
var workerankiwebframe = null;

pageMod1.PageMod({
	include: data.url("./content/ankifoxsearchresults.html"),
	contentScriptFile: data.url("content-script.js"),
	onAttach: attachWorker1
});

function attachWorker1 (worker) {
	workerdictframes = worker;
	workerdictframes.port.emit("initdictframe", selword, selindex, preferences, tabisalreadyopen);
	tabisalreadyopen = true;
	workerdictframes.port.on("changedictindex", function(index) {
		selindex = index;
	});
}

pageMod2.PageMod({
	include: "https://ankiweb.net/edit/",
	contentScriptFile: data.url("content-script.js"),
	onAttach: attachWorker2
});

function attachWorker2 (worker) {
	// only autocomplete if https://ankiweb.net/edit/ is loaded by this addon, not by user
	workerankiwebframe = worker;
	if (worker.tab.url == data.url("./content/ankifoxsearchresults.html")) {
		worker.port.emit("initankiwebframe", preferences.prefs["deckname"], preferences.prefs["notetype"], selword);
	}
}

// context menu handler
cm.Item({
	label: "Add to Anki",
	context: cm.SelectionContext(),
	contentScript: 'self.on("context", function () {' +
		'var text = window.getSelection().toString();'+
		'if (text.length > 20)'+
		'text = text.substr(0, 20) + "...";'+
		'return "Add \'" + text + "\' to Anki";'+
		'});'+
		'self.on("click", function () {'+
		'self.postMessage(window.getSelection().toString()); '+ // send selection to content script
		'});',
	contentScriptFile: data.url("content-script.js"),
	accessKey: "k",
	onMessage: function(word) {
		selword = word;
		// check if tab is open. If so, reload it. Otherwise, open new tab
		for (let tab of tabs)
			if (tab.url == data.url("./content/ankifoxsearchresults.html")) {
				attachWorker1(workerdictframes); // update dictionary frames
				attachWorker2(workerankiwebframe); // update anki web frame
				tab.activate();
				break;
			}
		if (tabisalreadyopen == false) {
			tabs.open({
  				url: data.url("./content/ankifoxsearchresults.html")	
			});
		}
	}
});

// Listen for tab closures & initialize variables
tabs.on('close', function onOpen(tab) {
	if (tab.url == data.url("./content/ankifoxsearchresults.html")) {
		selindex = preferences.prefs["use-dic"];
		selword = "";
		tabisalreadyopen = false;
	}
});

