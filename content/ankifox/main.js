"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");

var ankifox = {

  default_menutext: '',
  srcchanged: false,
  textSelection: '',

  getdicurl: function(word, dicindex) {
    var prefs = Services.prefs.getBranch("extensions.ankifox.");
    var usedicindex;

    if (dicindex == undefined) { // if dicindex not defined, used default
      usedicindex = parseInt(prefs.getCharPref("use-dic")) + 1;
    } else { // if defined, then used the quick temporary dictionary the user selected
      usedicindex = dicindex;
    }

    var url = prefs.getCharPref("dic" + usedicindex.toString()); // get custom dict url
    return encodeURIComponent(url.replace("%s", word)); // replace %s for the word we're searching
  },

  getSelectedText: function() {
    //check if the user is searching for a word located inside a textbox
    var focusedElement = document.commandDispatcher.focusedElement;

    if (focusedElement != null && focusedElement.value != null) {
      var selectionStart = focusedElement.selectionStart;
      var selectionEnd   = focusedElement.selectionEnd;
      var selectedText = focusedElement.value.substr(selectionStart, selectionEnd).trim();

      if (selectedText != null && selectedText != "")
      {
        return selectedText;
      }
    }

    //check if the user is searching for a word located inside the webpage (not inside a textbox)
    if (typeof getBrowserSelection == 'function') {
      return getBrowserSelection();
    }
    else {
      if (typeof content.getSelection == 'function') {
        return content.getSelection().toString().trim();
      }
      else {
        return "";
      }
    }
  },

  // source from: https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser
  IndexOfOpenTab: function (url) {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var browserEnumerator = wm.getEnumerator("navigator:browser");

    // Check each browser instance for our URL
    var found = false;
    while (!found && browserEnumerator.hasMoreElements()) {
      var browserWin = browserEnumerator.getNext();
      var tabbrowser = browserWin.gBrowser;

      // Check each tab of this browser instance
      var numTabs = tabbrowser.browsers.length;
      for (var index = 0; index < numTabs; index++) {
        var currentBrowser = tabbrowser.getBrowserAtIndex(index);
        if (url == currentBrowser.currentURI.spec) {

          // The URL is already opened. Select this tab.
          tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];

          // Focus *this* browser-window
          browserWin.focus();

          found = true;
          return tabbrowser;
          break;
        }
      }
    }
  },

  addtoanki: function() {

    ankifox.textSelection=ankifox.getSelectedText(); // get selection (from text box or web page)

    if (ankifox.textSelection!=''){
      var url='chrome://ankifox/content/ankifoxsearchresults.html';
      /*
       relatedToCurrent:true means the new tab will open up
       straight after the current tab - remove to open at end of tabs
      */

      var tabbrowser = ankifox.IndexOfOpenTab(url);

      if (tabbrowser != null) { // reuse tab
        var iframedict = tabbrowser.contentDocument.getElementById("dict");

        ankifox.srcchanged = false;
        iframedict.setAttribute("src","chrome://ankifox/content/loading.html"); // get dict url and open in iframe
      }
      else { // new tab
        var tab = gBrowser.addTab(url,{relatedToCurrent:true});
        ankifox.srcchanged = false;
        tabbrowser = gBrowser.getBrowserForTab(tab);
        gBrowser.selectedTab = tab;
      }

      // change dictionary url dynamically
      tabbrowser.addEventListener("load", function loadankiweb () {
        // add word to anki's 1st text box and setfocus on 2nd text box to add definition
        var iframedict = tabbrowser.contentDocument.getElementById("dict");
        var iframeseldict = tabbrowser.contentDocument.getElementById("seldict");
        var iframeankiweb = tabbrowser.contentDocument.getElementById("ankiweb");
        if (ankifox.srcchanged == false && tabbrowser.contentDocument.readyState === "complete" &&
             iframeankiweb.getAttribute("src").indexOf("https://ankiweb.net") > -1) { // avoid infinite loop
          if (iframeankiweb.contentWindow.document.getElementById("f0") != null) { // if already loged in to ankiweb...
            var prefs = Services.prefs.getBranch("extensions.ankifox.");
            //iframeankiweb.contentWindow.document.getElementById("models").selectedIndex = prefs.getCharPref("notetype");
            var notetypecombobox = iframeankiweb.contentWindow.document.getElementById("models");
            for(var i = 0, j = notetypecombobox.options.length; i < j; ++i) {
                    if(notetypecombobox.options[i].innerHTML === prefs.getCharPref("notetype")) {
                       notetypecombobox.selectedIndex = i;
                       break;
                    }
                }

            // simulate "models" onchange event to update ankiweb form
            var evt = iframeankiweb.contentWindow.document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            iframeankiweb.contentWindow.document.getElementById("models").dispatchEvent(evt);

            if (prefs.getCharPref("deckname") != "") { // if deckname = "" then use the one selected by default
              iframeankiweb.contentWindow.document.getElementById("deck").value = prefs.getCharPref("deckname");
            }
            iframeseldict.contentWindow.document.getElementById("tempdict").selectedIndex = 0;
            iframeankiweb.contentWindow.document.getElementById("f0").textContent = ankifox.textSelection;
            iframeankiweb.contentWindow.document.getElementById("f1").focus();
          } //else {    alert("You need to login to ankiweb for ankifox to work!")  }
          ankifox.srcchanged = true;
          iframedict.setAttribute("src",decodeURIComponent(ankifox.getdicurl(ankifox.textSelection))); // get dict url and open in iframe
        }
        tabbrowser.removeEventListener("load", loadankiweb);
      }, true);
    }
  },

  init: function() {
    // hides the menu item when no text is selected
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function(e) {
      var menu = document.getElementById('ankifox-menu-item');
      //var default_menutext = menu.getAttribute('label');
      if (ankifox.default_menutext == '')
             ankifox.default_menutext = menu.getAttribute('label');

      var textSelection = ankifox.getSelectedText();
      var compactedText = textSelection.substr(0,15);

      if (compactedText.length != textSelection.length)
        compactedText += '...';

      menu.hidden = (textSelection.length == 0);

      if (!menu.hidden)
        menu.setAttribute('label',ankifox.default_menutext + '"' + compactedText + '"');
    }, false);
  },

  changeseldict: function(evt) {
      var url='chrome://ankifox/content/ankifoxsearchresults.html';
      var tabbrowser = ankifox.IndexOfOpenTab(url);
      var iframedict = tabbrowser.contentDocument.getElementById("dict");
      ankifox.srcchanged = true;
      iframedict.setAttribute("src",decodeURIComponent(ankifox.getdicurl(ankifox.textSelection, evt.target.getAttribute("seltempdict")))); // get dict url and open in iframe
  }

}

document.addEventListener("changeseldict", function(e) { ankifox.changeseldict(e); }, false);

window.addEventListener("load", ankifox.init, true);