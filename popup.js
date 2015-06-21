// File: popup.js
// Author: Gregory Hoople
//
// File used by "popup.html" to alter the states of
// elements of that page.

// These functions are called by "background.js" to
// modify the html fields of "popup.html"

// Sets the current status ie. "Refreshing..."
function renderStatus(text) {
  document.getElementById('note').textContent = text;
}

// Sets the count of google mail
function setGoogle(text) {
	document.getElementById('goo').textContent = '(' + text + ")";
}

// Sets the message field of google mail
function setGMailMessage(text) {
	document.getElementById('gooMess').innerHTML = text;
}

// Sets the count of facebook
function setFacebook(text) {
	document.getElementById('fb').textContent = '(' + text + ")";
}

// Sets the count of google voice
function setGVoice(text) {
	document.getElementById('gv').textContent = '(' + text + ")";
}

// Sets the message field of google voice
function setGVoiceText(text) {
	document.getElementById('gvt').innerHTML = text;
}

// Scans through "popup.html" for any links and adds a
// function to each so that clicking them will open
// a new tab and load the correct location.
function refreshLinks() {
	var links = document.getElementsByTagName("a");
	for (var i = 0; i < links.length; i++) {
		(function () {
			var ln = links[i];
			var location = ln.href;
			ln.onclick = function () {
				chrome.tabs.create({active: true, url: location});
			};
		})();
	}
}

// This function is called when "popup.html" finishes loading.
// It will load which websites are enabled and adds specific
// html tags that "background.js" uses to add information to.
document.addEventListener('DOMContentLoaded', function() {
	document.body.style.width = '400px';
	renderStatus('Status');
	chrome.runtime.getBackgroundPage(function() {
		chrome.extension.getBackgroundPage().checkSites();
	});

	var cont = document.getElementById('content');
	cont.innerHTML = "";

	eFB = true; // Facebook enabled
	eGM = true; // Google Mail enabled
	eGV = true; // Google Voice enabled
	chrome.storage.sync.get({
		eface: true,
		egmail: true,
		egvoice: true
	}, function(items) {
		eFB = items.eface;
		eGM = items.egmail;
		eGV = items.egvoice;

		if ( eFB ) {
			cont.innerHTML += '<a href="http://www.facebook.com">Facebook Messages</a> <span id="fb">...</span><hr>';
		}

		if ( eGM ) {
			cont.innerHTML += '<a href="http://mail.google.com">Google Mail</a> <span id="goo">...</span>'
				+ '<br><div id="gooMess"></div><hr>';
		}

		if ( eGV ) {
			cont.innerHTML += '<a href="http://www.google.com/voice/">Google Voice</a> <span id="gv">...</span>'
				+ '<br><div id="gvt"></div><hr>';
		}

		if ( !eFB && !eGM && !eGV ) {
			renderStatus("Select options to enable services.");
		}

		refreshLinks();
	});
});
