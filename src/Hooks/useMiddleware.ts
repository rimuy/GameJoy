import {
	ActionEntry,
	ActionKey,
	ActionLikeArray,
	RawActionEntry,
	TransformAction,
} from "../definitions";

import { ActionConnection } from "../Class/ActionConnection";

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
	cloned.Lock();

	ActionConnection.From(cloned).Triggered((_, ...args) => {
		const result = middleware(cloned as never);

		if (Promise.is(result) ? result.await()[0] : result) {
			(
				cloned.Context! as unknown as {
					_Check(action: ActionEntry<R>, ...args: Array<unknown>): void;
				}
			)._Check(cloned, ...args);
		}
	});

	return cloned as unknown as TransformAction<R, A>;
}
