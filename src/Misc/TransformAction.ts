import type { Action as ActionT, Axis as AxisT, Union as UnionT } from "../Actions";

import { ActionLike, ActionLikeArray, AxisActionEntry, RawActionEntry } from "../definitions";

import * as t from "../Util/TypeChecks";

import { lazyLoad } from "./Lazy";

let Action: typeof ActionT;
lazyLoad("Action", (action) => (Action = action));

let Axis: typeof AxisT;
lazyLoad("Axis", (action) => (Axis = action));

let Union: typeof UnionT;
lazyLoad("Union", (action) => (Union = action));

export function transformAction<A extends RawActionEntry>(
	entry: AxisActionEntry | ActionLike<A> | ActionLikeArray<A>,
) {
	if (!t.isValidActionEntry(entry)) {
		error(debug.traceback("Invalid action entry."));
	}

	return t.isAction(entry)
		? entry
		: t.isActionLikeArray(entry)
		? new Union<A>(entry as never)
		: t.isAxisActionEntry(entry)
		? new Axis(entry)
		: new Action<A>(entry);
}
