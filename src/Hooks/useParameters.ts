import { ActionEntry, RawActionEntry, GetParameters } from "../definitions";

type ActionParameters<P extends Array<unknown>> = LuaTuple<P>;

/**
 * Extracts the current parameters of an action.
 */
export function useParameters<A extends ActionEntry<RawActionEntry>>(action: A) {
	return (action as unknown as { _GetLastParameters(): ActionParameters<GetParameters<A>> })[
		"_GetLastParameters"
	]();
}
