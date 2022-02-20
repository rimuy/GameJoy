import {
	ActionEntry,
	ActionKey,
	ActionLikeArray,
	RawActionEntry,
	TransformAction,
} from "../definitions";

import { transformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

/**
 * Executes an assertion before sending an activation request into the context.
 */
export function useMiddleware<R extends RawActionEntry, A extends ActionKey<R>>(
	action: A extends ActionEntry<R> ? A : A extends ActionLikeArray<R> ? ActionLikeArray<R> : R,
	middleware: (action: TransformAction<R, A>) => boolean | Promise<boolean>,
) {
	const cloned = t.isAction(action) ? action.Clone() : transformAction<R>(action as never);
	(
		cloned as unknown as {
			Middleware: (action: TransformAction<R, A>) => boolean | Promise<boolean>;
		}
	).Middleware = middleware;

	return cloned as unknown as TransformAction<R, A>;
}
