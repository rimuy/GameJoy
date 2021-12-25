import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";
import { BaseAction } from "../Class/BaseAction";

import { ActionConnection } from "../Class/ActionConnection";
import { TransformAction } from "../Misc/TransformAction";

/**
 * Variant that synchronizes its action when placed on the highest hierarchy.
 * Useful when the `RunSynchronously` option is disabled but you want a specific action to be executed synchronously.
 */
export class SynchronousAction<A extends RawActionEntry> extends BaseAction {
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
			if (this.IsActive) {
				this.SetTriggered(false);
			}
			this.Changed.Fire();
		});
	}
}

const actionMt = SynchronousAction as LuaMetatable<SynchronousAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Synchronous(${c.GetContentString().join(", ")})`;
