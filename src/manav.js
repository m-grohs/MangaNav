'use strict';

/**
 * React to Messages from service worker/background.js
 */
chrome.runtime.onMessage.addListener(handleState);

// Default Extension State OFF
let isExtensionActive = false;

function handleState(state, _) {
	isExtensionActive = state;
	console.log(isExtensionActive);
}
