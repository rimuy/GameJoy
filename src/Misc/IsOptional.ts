import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import type { OptionalAction } from "../Actions/OptionalAction";

import * as t from "../Util/TypeChecks";

export function isOptional<A extends RawActionEntry>(
	action: ActionLike<A> | ActionLikeArray<A>,
): action is OptionalAction<A> {
	return t.actionEntryIs(action, "OptionalAction");
}
