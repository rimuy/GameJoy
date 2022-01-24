// Original from: https://github.com/Dionysusnu/rbxts-rust-classes/blob/fa417965ef3c61fc2cdc0c1e1436f3153e007493/src/util/lazyLoad.ts
import type { Action, Axis, Union } from "../Actions";

interface ActionMap {
	Action: typeof Action;
	Axis: typeof Axis;
	Union: typeof Union;
}

type ActionKey = keyof ActionMap;

const objects: Partial<{ [K in ActionKey]: ActionMap[K] }> = {};

const waiting: Partial<
	Record<ActionKey, [Promise<ActionMap[ActionKey]>, (action: ActionMap[ActionKey]) => void]>
> = {};

export function lazyLoad<K extends ActionKey>(name: K, callback: (action: ActionMap[K]) => void) {
	const obj = objects[name];

	if (obj) {
		callback(obj as ActionMap[K]);
	} else {
		const waiter = waiting[name];
		if (waiter) {
			waiter[0].then((c) => callback(c as ActionMap[K]));
		} else {
			const prom = new Promise<ActionMap[ActionKey]>((resolve) => {
				waiting[name] = [prom, resolve];
			});
			const waiter = waiting[name] as [
				Promise<ActionMap[ActionKey]>,
				(c: ActionMap[ActionKey]) => void,
			];
			waiter[0] = prom;
			prom.then((c) => callback(c as ActionMap[K]));
		}
	}
}

export function lazyRegister<K extends keyof ActionMap>(name: K, action: ActionMap[K]): void {
	objects[name] = action;
	const waiter = waiting[name];
	if (waiter) {
		waiter[1](action);
	}
}
