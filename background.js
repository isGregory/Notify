// File: background.js
// Author: Gregory Hoople
//
// This file works in the background and is called periodically
// in order to check specified websites and scan them for certain
// regular expression matches such as new messages.

function httpGet(theUrl)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.addEventListener("load", function(e) {
			callback(xmlhttp.responseText);
		}, false);
	xmlhttp.open("GET", theUrl, true );
	xmlhttp.send();

}

function sendRequest(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			callback(xhr.responseText);
		}
	};
	xhr.open("GET", url, true);
	xhr.send();
}

function setFacebook(text) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setFacebook(text);
	}
}

function setGMail(text) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGoogle(text);
	}
}

function setGMailMessage(text) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGMailMessage(text);
	}
}

function setGVoice(text) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGVoice(text);
	}
}

function setGVoiceText(text) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGVoiceText(text);
	}
}

var cAlerts = 0;

function updateRefresh(rCount, nAlerts) {
	var popups = chrome.extension.getViews({type: "popup"});
	if ( parseInt( rCount ) <= 0 ) {
		setUnread(cAlerts);
	}
	if (0 < popups.length) {
		if ( parseInt( rCount ) <= 0 ) {
			popups[0].renderStatus("Up to date");
		} else {
			popups[0].renderStatus("Refreshing...");
		}
	}
}


function checkSites() {
	cAlerts = 0;
	refreshing = 0;
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

		if ( !eFB && !eGM && !eGV ) {
			setUnread(0);
		}

		if ( eFB ) {
			chrome.storage.local.get('faceCount', function (result) {
				setFacebook(result.faceCount);
			});
		} else {
			// Hide Facebook
		}

		if ( eGM ) {
			chrome.storage.local.get('gmailCount', function (result) {
				setGMail(result.gmailCount);
			});

			chrome.storage.local.get('gmailMess', function (result) {
				setGMailMessage(result.gmailMess);
			});
		} else {
			// Hide GMail
		}

		if ( eGV ) {
			chrome.storage.local.get('gvoiceCount', function (result) {
				setGVoice(result.gvoiceCount);
			});

			chrome.storage.local.get('gvMess', function (result) {
				setGVoiceText(result.gvMess);
			});
		} else {
			// Hide GVoice
		}


		if ( eFB ) {
			refreshing++;
			sendRequest('https://www.facebook.com', function (response) {
				var re = RegExp('"unseen_count":([0-9]+)');
				var m = re.exec(response);
				if( m != null ){
					cAlerts = parseInt(cAlerts) + parseInt(m[1]);
					setFacebook(m[1]);
					chrome.storage.local.set({'faceCount': m[1]});
				}
				refreshing--;
				updateRefresh(refreshing);
			});
		}

		if ( eGM ) {
			refreshing++;
			sendRequest('https://mail.google.com/mail/feed/atom', function (response) {
				var count = (response.match(/<entry>/g) || []).length;
				cAlerts = parseInt(cAlerts) + parseInt(count);
				if ( count >= 20 ) {
					setGMail("20+");
				} else {
					setGMail(count);
				}
				chrome.storage.local.set({'gmailCount': count});

				if ( count > 0 ) {
					var reName = RegExp('<name>(.*?)<\/name>');
					var m = reName.exec(response);
					var reTitle = RegExp('<entry><title>(.*?)<\/title>');
					var t = reTitle.exec(response);
					if( m != null && t != null ){
						var message = "<b>" + m[1] + "</b> - " + t[1];
						setGMailMessage(message);
						chrome.storage.local.set({'gmailMess': message});
					}
				} else {
					setGMailMessage("");
					chrome.storage.local.set({'gmailMess': ""});
				}
				refreshing--;
				updateRefresh(refreshing);
			});
		}

		if ( eGV ) {
			refreshing++;
			sendRequest('https://www.google.com/voice/request/unread', function (response) {
				var re = RegExp('"all":([0-9]+)');
				var m = re.exec(response);
				if( m != null ){
					var num = parseInt(m[1]);
					cAlerts = parseInt(cAlerts) + num;
					setGVoice(m[1]);
					chrome.storage.local.set({'gvoiceCount': m[1]});

					if ( num > 0 ) {
						sendRequest('http://google.com/voice/request/messages', function (response) {
							var re = RegExp('"displayNumber"(?:(?!"isRead":true,).)*?]},{"id":');
							var unread = re.exec(response);
							var reMess = RegExp('"displayNumber":"(.*?)","(.*?)"messageText":"(.*?)","(.*?)"relativeStartTime":"(.*?)"');
							var m = reMess.exec(unread[0]);
							if( m != null ){
								var message = "<b>" + m[5] + " - " + m[1] + "</b> - " + m[3];
								setGVoiceText(message);
								chrome.storage.local.set({'gvMess': message});
							}
						});
					} else {
						setGVoiceText("");
						chrome.storage.local.set({'gvMess': ""});
					}
				}
				refreshing--;
				updateRefresh(refreshing);
			});
		}
	});

	// Google Voice
	// Get list of unread numbers
	//https://www.google.com/voice/request/unread
	// Get list of messages for information to pull unread from
	//http://google.com/voice/request/messages
}

function setUnread(cnt) {
	if ( parseInt(cnt) == 0 ) {
		chrome.browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 255]});
		chrome.browserAction.setBadgeText({text: ''});
	} else {
		chrome.browserAction.setBadgeBackgroundColor({color: [0, 200, 0, 255]});
		chrome.browserAction.setBadgeText({text: '' + cnt});
	}
}

chrome.runtime.onInstalled.addListener(function () {
	chrome.alarms.create( "refresh", {delayInMinutes: 1.0});
});

chrome.alarms.onAlarm.addListener(function() {
	// Time's up!
	checkSites();
	chrome.alarms.create( "refresh", {delayInMinutes: 1.0});
});

chrome.runtime.onSuspend.addListener(function() {
	//console.log("Unloading.");
	//chrome.browserAction.setBadgeText({text: ""});
	//chrome.tabs.sendMessage(lastTabId, "Background page unloaded.");
});
