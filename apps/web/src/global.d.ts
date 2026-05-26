import 'react-router';
module 'virtual:load-fonts.jsx' {
	export function LoadFonts(): null;
}
declare module '*.jsx' {
	import type { ComponentType } from 'react';
	const component: ComponentType<Record<string, unknown>>;
	export default component;
}
declare module 'react-router' {
	interface AppLoadContext {
		// add context properties here
	}
}
declare module 'npm:stripe' {
	import Stripe from 'stripe';
	export default Stripe;
}
declare module '@auth/create/react' {
	import { SessionProvider } from '@auth/react';
	export { SessionProvider };
}
