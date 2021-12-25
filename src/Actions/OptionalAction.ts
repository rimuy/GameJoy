import { ActionConnection } from "../Class/ActionConnection";
import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { TransformAction } from "../Misc/TransformAction";

/**
 * Variant that is used to act as a "ghost" action when placed inside objects that accepts multiple entries.
 * Its parent action can trigger without the need of the action being active, and will trigger again once the action activates.
 */
export class OptionalAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: ActionLike<A> | ActionLikeArray<A>) {
		super();
	}

	protected OnConnected() {
		const action = TransformAction<A>(this.RawAction, Action, Union);
		const connection = ActionConnection.From(action);

		action.SetContext(this.Context);

		connection.Triggered(() => {
			this.SetTriggered(true);
			this.Changed.Fire();
		});

		connection.Released(() => {
			this.SetTriggered(false);
			this.Changed.Fire();
		});

		ActionConnection.From(this).Destroyed(() => {
			action.Destroy();
		});
	}
}

const actionMt = OptionalAction as LuaMetatable<OptionalAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Optional(${c.GetContentString().join(", ")})`;
