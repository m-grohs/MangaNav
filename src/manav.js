'use strict';

const extensionActive = false;

/**
 * React to Messages from service worker/background.js
 */
browser.runtime.onMessage.addListener((msg) => {
	console.log(msg);
});
