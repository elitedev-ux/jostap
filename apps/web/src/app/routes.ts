import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type RouteConfigEntry,
	index,
	route,
} from '@react-router/dev/routes';

const appRoutesDirectory = fileURLToPath(new URL('.', import.meta.url));

type Tree = {
	path: string;
	children: Tree[];
	hasPage: boolean;
	hasLayout: boolean;
	isParam: boolean;
	paramName: string;
	isCatchAll: boolean;
};

function buildRouteTree(dir: string, basePath = ''): Tree {
	const files = readdirSync(dir);
	const node: Tree = {
		path: basePath,
		children: [],
		hasPage: false,
		hasLayout: false,
		isParam: false,
		isCatchAll: false,
		paramName: '',
	};

	// Check if the current directory name indicates a parameter
	const dirName = basePath.split('/').pop();
	if (dirName?.startsWith('[') && dirName.endsWith(']')) {
		node.isParam = true;
		const paramName = dirName.slice(1, -1);

		// Check if it's a catch-all parameter (e.g., [...ids])
		if (paramName.startsWith('...')) {
			node.isCatchAll = true;
			node.paramName = paramName.slice(3); // Remove the '...' prefix
		} else {
			node.paramName = paramName;
		}
	}

	for (const file of files) {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			const childPath = basePath ? `${basePath}/${file}` : file;
			const childNode = buildRouteTree(filePath, childPath);
			node.children.push(childNode);
		} else if (file === 'page.jsx') {
			node.hasPage = true;
    } else if (file === 'layout.jsx') {
			node.hasLayout = true;
    }
	}

	return node;
}

function componentPathFor(node: Tree, file: 'page.jsx' | 'layout.jsx'): string {
	return node.path === '' ? `./${file}` : `./${node.path}/${file}`;
}

function routePathFor(path: string, parentPath = '') {
	if (!parentPath) return path;
	if (path === parentPath) return '';
	if (path.startsWith(`${parentPath}/`)) {
		return path.slice(parentPath.length + 1);
	}
	return path;
}

function routePatternFor(path: string) {
	const segments = path.split('/');
	const processedSegments = segments.map((segment) => {
		if (segment.startsWith('[') && segment.endsWith(']')) {
			const paramName = segment.slice(1, -1);

			if (paramName.startsWith('...')) {
				return '*';
			}
			if (paramName.startsWith('[') && paramName.endsWith(']')) {
				return `:${paramName.slice(1, -1)}?`;
			}
			return `:${paramName}`;
		}
		return segment;
	});

	return processedSegments.join('/');
}

function generateRoutes(node: Tree, parentPath = ''): RouteConfigEntry[] {
	const routes: RouteConfigEntry[] = [];

	if (node.hasLayout && node.path !== '') {
		const children: RouteConfigEntry[] = [];

		if (node.hasPage) {
			children.push(index(componentPathFor(node, 'page.jsx')));
		}

		for (const child of node.children) {
			children.push(...generateRoutes(child, node.path));
		}

		routes.push(route(routePatternFor(routePathFor(node.path, parentPath)), componentPathFor(node, 'layout.jsx'), children));
		return routes;
	}

	if (node.hasPage) {
		const componentPath = componentPathFor(node, 'page.jsx');

		if (node.path === '') {
			routes.push(index(componentPath));
		} else {
			routes.push(route(routePatternFor(routePathFor(node.path, parentPath)), componentPath));
		}
	}

	for (const child of node.children) {
		routes.push(...generateRoutes(child, parentPath));
	}

	return routes;
}
if (import.meta.env.DEV) {
	import.meta.glob('./**/page.jsx', {});
	if (import.meta.hot) {
		import.meta.hot.accept((newSelf) => {
			import.meta.hot?.invalidate();
		});
	}
}
const tree = buildRouteTree(appRoutesDirectory);
const notFound = route('*', './__create/not-found.tsx');
const routes = [...generateRoutes(tree), notFound];

export default routes;
