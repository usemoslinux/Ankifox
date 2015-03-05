"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");

var ankifox = {
	
	init: function() {
		
		var prefs = Services.prefs.getBranch("extensions.ankifox.");
		
		document.getElementById("dicname1").value = prefs.getCharPref("dicname1");
		document.getElementById("dicname2").value = prefs.getCharPref("dicname2");
		document.getElementById("dicname3").value = prefs.getCharPref("dicname3");
		document.getElementById("dicname4").value = prefs.getCharPref("dicname4");

		document.getElementById("dic1").value = prefs.getCharPref("dic1");
		document.getElementById("dic2").value = prefs.getCharPref("dic2");
		document.getElementById("dic3").value = prefs.getCharPref("dic3");
		document.getElementById("dic4").value = prefs.getCharPref("dic4");
		
		document.getElementById("use-dic").selectedIndex = prefs.getCharPref("use-dic");

		document.getElementById("notetype").value = prefs.getCharPref("notetype");
		document.getElementById("deckname").value = prefs.getCharPref("deckname");

	},
	
	accept: function() {
		
		var prefs = Services.prefs.getBranch("extensions.ankifox.");
		
		prefs.setCharPref("dicname1", document.getElementById("dicname1").value);
		prefs.setCharPref("dicname2", document.getElementById("dicname2").value);
		prefs.setCharPref("dicname3", document.getElementById("dicname3").value);
		prefs.setCharPref("dicname4", document.getElementById("dicname4").value);

		prefs.setCharPref("dic1", document.getElementById("dic1").value);
		prefs.setCharPref("dic2", document.getElementById("dic2").value);
		prefs.setCharPref("dic3", document.getElementById("dic3").value);
		prefs.setCharPref("dic4", document.getElementById("dic4").value);
		
		prefs.setCharPref("use-dic", document.getElementById("use-dic").selectedIndex);

		prefs.setCharPref("notetype", document.getElementById("notetype").value);
		prefs.setCharPref("deckname", document.getElementById("deckname").value);
		
	}
	
}