import { BaseAction as GBaseAction } from "./Class/BaseAction";
import { Context as GContext } from "./Class/Context";

import * as GActions from "./Actions";
import * as Checks from "./Util/TypeChecks";

import {
	ActionEntry,
	ContextOptions,
	InferEnumItemName,
	RawActionEntry,
	RawActionLike,
} from "./Definitions/Types";

// Utility Types
declare namespace GameJoy {
	export { ActionEntry, ContextOptions, InferEnumItemName, RawActionEntry, RawActionLike };
}

namespace GameJoy {
	// Classes
	export const Context = GContext;
	export const BaseAction = GBaseAction;

	// Actions
	export const Actions = GActions;

	// Type Checks
	export const TypeChecks = Checks;

	// Constants
	export const VERSION = PKG_VERSION;
}

export = GameJoy;
