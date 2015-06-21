// File: background.js
// Author: Gregory Hoople
//
// This file works in the background and is called periodically
// in order to check specified websites and scan them for certain
// regular expression matches such as new messages.


// Sends a request to load a webpage and return it's text
// to the specified 'callback' function.
//
// Inputs:
// url      - String of website ie "http://www.google.com"
// callback - Function to send the resulting site-text to.
function sendRequest( url, callback ) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			callback(xhr.responseText);
		}
	};
	xhr.open("GET", url, true);
	xhr.send();
}

// Function to modify the count field of Facebook.
// text - String to set field to.
function setFacebook( text ) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setFacebook(text);
	}
}

// Function to modify the count field of google mail.
// text - String to set field to.
function setGMail( text ) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGoogle(text);
	}
}

// Function to modify the text field of google mail.
// text - String to set field to.
function setGMailMessage( text ) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGMailMessage(text);
	}
}

// Function to modify the count field of google voice.
// text - String to set field to.
function setGVoice( text ) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGVoice(text);
	}
}

// Function to modify the text field of google voice.
// text - String to set field to.
function setGVoiceText( text ) {
	var popups = chrome.extension.getViews({type: "popup"});
	if (0 < popups.length) {
		popups[0].setGVoiceText(text);
	}
}

var cAlerts = 0;

// This function updates the value of messsages as well as
// the status notification to let the user know when all
// the checks have updated.
// rCount - The refreshed count thus far.
function updateRefresh( rCount ) {
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
	// 'cAlerts' keeps track of the current count of alerts.
	// It is the sum of all unread messages from the various
	// websites.
	cAlerts = 0;

	// 'refreshing' keeps track of how many requests are currently
	// still checking and have not yet returned. This allows us
	// to know when things have finished updating.
	refreshing = 0;

	eFB = true; // Enable Facebook
	eGM = true; // Enable Google Mail
	eGV = true; // Enable Google Voice
	chrome.storage.sync.get({
		// Request their preferences from google's storage.
		eface: true,
		egmail: true,
		egvoice: true
	}, function(items) {
		// Set the local values to the stored values.
		eFB = items.eface;
		eGM = items.egmail;
		eGV = items.egvoice;

		// Nothing enabled, turn off the badge and return.
		if ( !eFB && !eGM && !eGV ) {
			setUnread(0);
			return;
		}

		// Here we check the enabled websites and load up the most recent
		// values for display. These values will be updated in a
		// moment, but allow for the user to see the most recent check.

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

		// Now that the defaults are loaded we send off requests to the
		// enabled websites to see how many unread messages there are.

		// Checks user's facebook page for unread messages.
		if ( eFB ) {
			refreshing++;
			sendRequest('https://www.facebook.com', function (response) {
				var re = RegExp('"unseen_count":([0-9]+)');
				var m = re.exec(response);
				if( m != null ){

					// We don't know when this function will return
					// relative to the other websites being checked
					// so we update cAlerts with it's own value and
					// the count received from the website just checked.
					cAlerts = parseInt(cAlerts) + parseInt(m[1]);
					setFacebook(m[1]);

					// We set the Facebook count to local storage as this becomes
					// the default value the next time the user clicks the icon
					// and the information hasn't loaded just yet.
					chrome.storage.local.set({'faceCount': m[1]});
				}
				refreshing--;
				updateRefresh(refreshing);
			});
		}

		// Google Mail
		// Checks the RSS atom feed for the count of unread
		// messages and the start of the most recent message.
		if ( eGM ) {
			refreshing++;
			sendRequest('https://mail.google.com/mail/feed/atom', function (response) {
				var count = (response.match(/<entry>/g) || []).length;

				// We don't know when this function will return
				// relative to the other websites being checked
				// so we update cAlerts with it's own value and
				// the count received from the website just checked.
				cAlerts = parseInt(cAlerts) + parseInt(count);

				// Google Mail's atom feed only seems to go up to 20.
				if ( count >= 20 ) {
					setGMail("20+");
				} else {
					setGMail(count);
				}

				// We set the Gmail count to local storage as this becomes
				// the default value the next time the user clicks the icon
				// and the information hasn't loaded just yet.
				chrome.storage.local.set({'gmailCount': count});

				if ( count > 0 ) {
					// There is at least one message to pull
					// information from and display to the user.
					var reName = RegExp('<name>(.*?)<\/name>');
					var m = reName.exec(response);
					var reTitle = RegExp('<entry><title>(.*?)<\/title>');
					var t = reTitle.exec(response);

					// Check we have both a sender, and a message.
					if( m != null && t != null ){
						var message = "<b>" + m[1] + "</b> - " + t[1];
						setGMailMessage(message);
						chrome.storage.local.set({'gmailMess': message});
					}
				} else {
					// No messages, so clear the prompt.
					setGMailMessage("");
					chrome.storage.local.set({'gmailMess': ""});
				}
				refreshing--;
				updateRefresh(refreshing);
			});
		}


		// Google Voice
		// Get list of unread numbers
		// https://www.google.com/voice/request/unread
		// Get list of messages for information to pull unread from
		// http://google.com/voice/request/messages
		if ( eGV ) {
			refreshing++;
			sendRequest('https://www.google.com/voice/request/unread', function (response) {
				var re = RegExp('"all":([0-9]+)');
				var m = re.exec(response);
				if( m != null ){
					var num = parseInt(m[1]);
					cAlerts = parseInt(cAlerts) + num;
					setGVoice(m[1]);

					// We set the Google Voice count to local storage as this becomes
					// the default value the next time the user clicks the icon
					// and the information hasn't loaded just yet.
					chrome.storage.local.set({'gvoiceCount': m[1]});

					if ( num > 0 ) {
						// There's at least one message so we send
						// a request to check for a text message.
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
}

// This function specifies a badge for the icon which tells
// the user how many unread messages they have waiting from
// the various services they're set up to track.
function setUnread(count) {
	if ( parseInt(count) == 0 ) {
		// This sets the notification badge to disappear.
		// Color is set just incase an issue occurs with removing it.
		chrome.browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 255]});
		chrome.browserAction.setBadgeText({text: ''});
	} else {
		// Set the notification badge to the count.
		chrome.browserAction.setBadgeBackgroundColor({color: [0, 200, 0, 255]});
		chrome.browserAction.setBadgeText({text: '' + count});
	}
}

// This function is called when the extension first starts up
// and begins by setting up an alarm.
chrome.runtime.onInstalled.addListener(function () {
	chrome.alarms.create( "refresh", {delayInMinutes: 1.0});
});

// When the alarm time is up this function is called.
// It checks websites for new messages and then goes to
// sleep for anothre minute.
chrome.alarms.onAlarm.addListener(function() {
	// Time's up!
	checkSites();
	chrome.alarms.create( "refresh", {delayInMinutes: 1.0});
});

// This function is called when the extension is unloaded
// in the time between alarms.
chrome.runtime.onSuspend.addListener(function() {
	//console.log("Unloading.");
	//chrome.browserAction.setBadgeText({text: ""});
	//chrome.tabs.sendMessage(lastTabId, "Background page unloaded.");
});
