import type { Action, Mixed } from "../Actions";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";

import * as t from "./TypeChecks";

export function TransformAction<A extends RawActionEntry>(
	entry: A | ActionEntry<A> | Array<A | ActionEntry<A>>,
	ActionClass: typeof Action,
	ArrayActionClass: typeof Mixed,
) {
	if (!t.isValidActionEntry(entry)) {
		error(debug.traceback("Invalid action entry."));
	}

	return t.isAction(entry)
		? entry
		: t.isActionLikeArray(entry)
		? new ArrayActionClass<A>(entry)
		: new ActionClass<A>(entry);
}
