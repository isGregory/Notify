// File: popup.js
// Author: Gregory Hoople
//
// File used by "popup.html" to alter the states of
// elements of that page.

function renderStatus(text) {
  document.getElementById('note').textContent = text;
}

function setGoogle(text) {
	document.getElementById('goo').textContent = '(' + text + ")";
}

function setGMailMessage(text) {
	document.getElementById('gooMess').innerHTML = text;
}

function setFacebook(text) {
	document.getElementById('fb').textContent = '(' + text + ")";
}

function setGVoice(text) {
	document.getElementById('gv').textContent = '(' + text + ")";
}

function setGVoiceText(text) {
	document.getElementById('gvt').innerHTML = text;
}

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

document.addEventListener('DOMContentLoaded', function() {
	document.body.style.width = '400px';
	renderStatus('Status');
	chrome.runtime.getBackgroundPage(function() {
		chrome.extension.getBackgroundPage().checkSites();
	});

	var cont = document.getElementById('content');
	cont.innerHTML = "";

	eFB = true;
	eGM = true;
	eGV = true;
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
