self.port.on("initdictframe", function init (word, preferences, tabisalreadyopen) {
	window.onload=updatedictframes(word, preferences, tabisalreadyopen);
});

// load dictionary frames on the left
function updatedictframes(word, index, preferences, tabisalreadyopen) {
	// update dictionary list in top frame
	window.frames[0].document.getElementById("dict1").text = preferences.prefs['dicname1'];	
	window.frames[0].document.getElementById("dict2").text = preferences.prefs['dicname2'];
	window.frames[0].document.getElementById("dict3").text = preferences.prefs['dicname3'];
	window.frames[0].document.getElementById("dict4").text = preferences.prefs['dicname4'];

	// load the corresponding dictionary page when user selects another dictionary in top frame
	tempdict = window.frames[0].document.getElementById("tempdict");
	tempdict.onchange = function() {
		updatedictlowerframe(word, this.selectedIndex, preferences, tabisalreadyopen);
	};

	updatedictlowerframe(word, index, preferences, tabisalreadyopen);
}

// update dictionary lower left frame
function updatedictlowerframe(word, index, preferences, tabisalreadyopen) {
	// update dictionary frame (lower frame)
	self.port.emit("changedictindex", index);

	var usedicindex;

	// select the corresponding dictionary in the combobox
	window.frames[0].document.getElementById("tempdict").selectedIndex = index;

	if (index == undefined) { // if index not defined, use default
		usedicindex = parseInt(preferences.prefs['use-dic']) + 1;
	} else { // if defined, then used the quick temporary dictionary the user selected
		usedicindex = index;
	}

	var url = preferences.prefs['dic' + usedicindex.toString()]; // get custom dict url
	url = url.replace("%s", encodeURIComponent(word)); // replace %s for the word we're searching
	document.getElementById("dict").src = url;
}

// update anki web frame
self.port.on("initankiwebframe", function(deck, notetype, word) {
		// select note type
		var notetypecombobox = window.document.getElementById("models");
		for(var i = 0, j = notetypecombobox.options.length; i < j; ++i) {
			if(notetypecombobox.options[i].innerHTML === notetype) {
				notetypecombobox.selectedIndex = i;
				break;
			}
		}

		// select deck
		if (deck != "") {
			window.document.getElementById("deck").value = deck;
		}

		// add word and give focus to the next input box
		window.document.getElementById("f0").textContent = word;
		window.document.getElementById("f1").focus();
});
