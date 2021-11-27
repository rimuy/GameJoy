import type { Action, Union } from "../Actions";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";

import * as t from "./TypeChecks";

export function transformAction<A extends RawActionEntry>(
	entry: A | ActionEntry<A> | Array<A | ActionEntry<A>>,
	ActionClass: typeof Action,
	ActionArrayClass: typeof Union,
) {
	if (!t.isValidActionEntry(entry)) {
		error(debug.traceback("Invalid action entry."));
	}

	return t.isAction(entry)
		? entry
		: t.isActionLikeArray(entry)
		? new ActionArrayClass<A>(entry)
		: new ActionClass<A>(entry);
}
