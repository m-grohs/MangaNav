/**
 * @file background.js for Browser Extension MANAv
 * @copyright m-grohs 2023-2024
 */

chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.action.onClicked.addListener(handleOnClick);

const SETTINGS = {
	DB_NAME: 'MANAvActiveSites',
	SITE_STATUS: false,
	ICON_ON: 'src/icons/manav-on.svg',
	ICON_OFF: 'src/icons/manav-off.svg'
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
 * @param {string} state - the Message to send
 */
function sendSignal(tabID, state) {
	browser.tabs.sendMessage(tabID, state);
}

/**
 * Handles Update Event from the active Tab
 * @param {number} _ - tabID - the ID of the active Tab
 * @param {*} changeInfo - the ChangeInfo Object that fires everytime anything changes in the Tab
 * @param {*} tab - the finished Tab Object
 *
 * @Info the changeInfo Object is changing everytime the Event is fired ending in only
 * a changeInfo.status === complete State.
 * to Send Messages properly to the content script we need to wait until this Event is finished
 */
async function handleUpdate(_, changeInfo, tab) {
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
		// Switch Icon dependint of SITE_STATUS
		if (SETTINGS.SITE_STATUS) {
			switchIcon(true);
			sendSignal(tab.id, true);
			return;
		}

		switchIcon(false);
	}
}

/**
 * Handle onClick Events from the Extension Button
 * @param {*} tab - Tab Object
 * @param {*} _ - onClickData unused
 */
async function handleOnClick(tab, _) {
	if (tab.status === 'complete') {
		const originURL = await stripToOriginURL(tab.url);
		const activeSiteURLs = await getURLs();

		// Add/Remove URL from Active Site Array
		// Switch Icon to correct State and send said State to content script
		if (await checkURL(originURL, activeSiteURLs)) {
			activeSiteURLs.splice(activeSiteURLs.indexOf(originURL), 1);
			switchIcon(false);
			sendSignal(tab.id, false);
		} else {
			activeSiteURLs.push(originURL);
			switchIcon(true);
			sendSignal(tab.id, true);
		}

		await setURLs(activeSiteURLs);
	}
}
