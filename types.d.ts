declare module "*.svg" {
	import { VNode } from "vue";

	// DON'T DECLARE THIS INSIDE GLOBAL MODULE
	type Svg = VNode;

	const content: Svg;
	export default {};
}
declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<{}, {}, any>;
	export default component;
}
