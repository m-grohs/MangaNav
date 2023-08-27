/**
 * @file background.js for Browser Extension MANAv
 * @copyright m-grohs 2023
 */

/**
 * @bug @function handleClick() and @function handleUpdate() can interfere with each other when the Site is
 * not completed yet. (giving OFF Signal even tho it should be ON)
 * You can click Extension Button and change State and Storage even tho @function handleUpdate() is not done yet
 *
 * @todo @function setIcon rewrite without using bools but including check for it
 * @todo remove @var SITE_STATUS and rewrite to integrate Status without it
 */

const SETTINGS = {
	DB_NAME: 'MANAvActiveSites',
	SITE_STATUS: false,
	ICON_ON: './icons/manav-on.svg',
	ICON_OFF: './icons/manav-off.svg'
};

/**
 * Checks for existence of the Active Site Array in storage.local and returns an Array
 * @return {Array} storage.local Active Site Array
 */
async function getURLs() {
	// Check and Set Default DB Name and Values if not present
	const currentDB = await browser.storage.local.get(SETTINGS.DB_NAME);
	if (currentDB[SETTINGS.DB_NAME] === undefined) {
		console.log('DB not Found... Setting Default Values...');
		await setURLs([]);
		return [];
	}
	return Array.from(currentDB[SETTINGS.DB_NAME]);
}

/**
 * Sets a new storage Value
 * @param {arr} arr - the New Values to be stored
 */
async function setURLs(arr) {
	await browser.storage.local.set({
		[SETTINGS.DB_NAME]: arr
	});
}

/**
 * URL Check if present in Active Site Array
 * @param {string} originURL - the present URL stripped down to .origin Values
 * @param {Array} toCheckURLs - Array representing all current active Sites
 * @returns {bool}
 */
async function checkURL(originURL, toCheckURLs) {
	if (toCheckURLs.includes(originURL)) {
		return true;
	}
	return false;
}

/**
 * Shortens URL to .origin Format (stripping everything from the 3rd "/")
 * Regex /^(?:[^\/]*\/){2}[^\/]+/g
 * @param {string} url - URL to be shorten
 * @returns {string} - finished URL
 */
async function stripToOriginURL(url) {
	return url.match(/^(?:[^\/]*\/){2}[^\/]+/g).toString();
}

/**
 * Change Extension Icon depening on Status from the Active Site Array
 * @param {bool} bool
 */
function switchIcon(bool) {
	if (bool) {
		browser.action.setIcon({ path: SETTINGS.ICON_ON });
		return;
	}
	browser.action.setIcon({ path: SETTINGS.ICON_OFF });
}

/**
 * Sends a Signal to content script
 * @param {number} tabID - the ID of the active Tab
 * @param {string} msg - the Message to send
 */
function sendSignal(tabID, msg) {
	browser.tabs.sendMessage(tabID, msg);
}
// testing
const count = 0;

/**
 * Handles Update Event from the active Tab
 * @param {number} tabID - the ID of the active Tab
 * @param {*} changeInfo - the ChangeInfo Object that fires everytime anything changes in the Tab
 * @param {*} tab - the finished Tab Object
 *
 * @Info the changeInfo Object is changing everytime the Event is fired ending in only
 * a changeInfo.status === complete State.
 * to Send Messages properly to the content script we need to wait until this Event is finished
 *
 * @todo Rewrite so we dont use @var SITE_STATUS and wait for complete Status to do anything
 */
async function handleUpdate(tabID, changeInfo, tab) {
	// Get URL and check it against the Active Sites Array
	if (changeInfo.url) {
		const originURL = await stripToOriginURL(changeInfo.url);
		const activeSitesURLs = await getURLs();

		if (await checkURL(originURL, activeSitesURLs)) {
			SETTINGS.SITE_STATUS = true;
		} else {
			SETTINGS.SITE_STATUS = false;
		}
	}

	// After checking and waiting for the changeInfo event to finish
	// Depending on the Outcome switch Extension Icon and send Message to content script!
	if (changeInfo.status === 'complete' && tab.status === 'complete') {
		if (SETTINGS.SITE_STATUS) {
			// Switch to On Icon and send Signal to Tab
			console.log('site is in array');
			switchIcon(true);
			sendSignal(tabID, 'bg.js -> send msg from true');
		} else {
			console.log('site is not in array');
			switchIcon(false);
			sendSignal(tabID, 'bg.js -> send msg from false');
		}
	}
}

/**
 * Handle onClick Events from the Extension Button
 * @param {*} tab - Tab Object
 * @param {*} onClickData
 */
async function handleOnClick(tab, onClickData) {
	if (tab.status === 'complete') {
		const originURL = await stripToOriginURL(tab.url);
		const activeSiteURLs = await getURLs();

		// Add/Remove URL from Active Site Array and use correct Icon for the State after
		if (await checkURL(originURL, activeSiteURLs)) {
			activeSiteURLs.splice(activeSiteURLs.indexOf(originURL), 1);
			switchIcon(false);
		} else {
			activeSiteURLs.push(originURL);
			switchIcon(true);
		}

		await setURLs(activeSiteURLs);
	}
}

browser.tabs.onUpdated.addListener(handleUpdate);
browser.action.onClicked.addListener(handleOnClick);
