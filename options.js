// File: options.js
// Author: Gregory Hoople
//
// File used by "options.html" to load and save settings.

// Saves options to chrome.storage
function save_options() {
	//var color = document.getElementById('color').value;
	var eface = document.getElementById('facebook').checked;
	var egmail = document.getElementById('gmail').checked;
	var egvoice = document.getElementById('gvoice').checked;
	chrome.storage.sync.set({
		eface: eface,
		egmail: egmail,
		egvoice: egvoice
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options Saved';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	// Use default value color = 'red' and likesColor = true.
	chrome.storage.sync.get({
		eface: true,
		egmail: true,
		egvoice: true
	}, function(items) {
		//document.getElementById('color').value = items.favoriteColor;
		document.getElementById('facebook').checked = items.eface;
		document.getElementById('gmail').checked = items.egmail;
		document.getElementById('gvoice').checked = items.egvoice;
	});
}

document.addEventListener('DOMContentLoaded', restore_options);

document.getElementById('save').addEventListener('click',
	save_options);
