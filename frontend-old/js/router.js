import * as auth from './auth.js';
import * as telemetry from './utils/telemetry.js';

let routes = [];
let currentCleanup = null;
let outlet;

function toParts(path) {
	return path.replace(/^#/, '').split('/').filter(Boolean);
}

function matchRoute(hash, routePath) {
	const actualParts = toParts(hash || '#/');
	const routeParts = toParts(routePath || '#/');
	if (routeParts.length === 0 && actualParts.length === 0) {
		return {};
	}
	if (routeParts.length !== actualParts.length) {
		return null;
	}
	const params = {};
	for (let index = 0; index < routeParts.length; index += 1) {
		const expected = routeParts[index];
		const actual = actualParts[index];
		if (expected.startsWith(':')) {
			params[expected.slice(1)] = decodeURIComponent(actual);
			continue;
		}
		if (expected !== actual) {
			return null;
		}
	}
	return params;
}

function renderRoute() {
	const hash = window.location.hash || '#/';
	const route = routes.find((entry) => matchRoute(hash, entry.path) !== null);
	if (!route) {
		window.location.hash = '#/';
		return;
	}

	if (route.requiresAuth && !auth.isAuthenticated()) {
		window.location.hash = '#/login';
		return;
	}

	if (route.roles && route.roles.length > 0 && !auth.hasRole(...route.roles)) {
		window.location.hash = '#/';
		return;
	}

	if (typeof currentCleanup === 'function') {
		currentCleanup();
		currentCleanup = null;
	}

	const params = matchRoute(hash, route.path) || {};
	const result = route.render({ params, route: hash });
	outlet.replaceChildren(result.element);
	currentCleanup = result.cleanup;
	telemetry.pageView(hash);
}

export function init(routeDefinitions, outletElement) {
	routes = routeDefinitions;
	outlet = outletElement;
	window.addEventListener('hashchange', renderRoute);
	renderRoute();
}

export function navigate(path) {
	window.location.hash = path;
}
