'use strict';

// Listen to Message from background
chrome.runtime.onMessage.addListener(handleState);

// Default Extension State OFF
let isExtensionActive = false;
let prevHref, nextHref;

/**
 * Handle the incoming State from background
 *
 * @param {*} state
 */
function handleState(state) {
	isExtensionActive = state;

	if (isExtensionActive === true) {
		addNavigation();
	}
	if (isExtensionActive === false) {
		removeNavigation();
	}
}

/**
 * Filter and Adds new Link Locations
 */
function addNavigation() {
	const navLabels = ['prev', 'next'];
	const anchorNodes = document.querySelectorAll('a');

	for (const anchor of anchorNodes) {
		if (anchor.textContent.toLowerCase().includes(navLabels[0])) {
			prevHref = anchor.href;
			break;
		}
	}
	for (const anchor of anchorNodes) {
		if (anchor.textContent.toLowerCase().includes(navLabels[1])) {
			nextHref = anchor.href;
			break;
		}
	}

	document.addEventListener('keydown', handleKeydown);
}

/**
 * Takes Event and Process Key Inputs for Redirection of new URL
 * also removes Navigation if no valid URL is present
 * Still throws a TypeError when link is undefined
 *
 * @param {*} e
 */
function handleKeydown(e) {
	if (e.key === 'ArrowLeft') {
		console.log('prev: ' + prevHref + ' origin: ' + window.origin);
		if (!prevHref.includes(window.origin)) {
			removeNavigation();
		} else {
			window.location.href = prevHref;
		}
	}

	if (e.key === 'ArrowRight') {
		console.log('next: ' + nextHref + ' origin: ' + window.origin);
		if (!nextHref.includes(window.origin)) {
			removeNavigation();
		} else {
			window.location.href = nextHref;
		}
	}
}

/**
 * Takes a Link and Filter unwanted Regex out.
 *
 * Some cases of new links have unwwanted Symbols in them like # that are not redirectable.
 * Filter them out for valid URLs
 *
 * @param {*} link
 * @returns {*} filterd valid URL
 */
// function filterLink(link) {
// 	// Filter out # in link
// 	const reg = /^[^#]*/;

// 	const newLink = link.match(reg);
// 	console.log('old: ' + link + '\nnew: ' + newLink);
// 	return newLink;
// }

/**
 * Removes lingering Navigation when Site is removed
 */
function removeNavigation() {
	document.removeEventListener('keydown', handleKeydown);
}
