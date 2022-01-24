import type Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import { BaseAction } from "../Class/BaseAction";
import { ActionConnection } from "../Class/ActionConnection";

import { transformAction } from "../Misc/TransformAction";

/**
 * Variant that synchronizes its action when placed on the highest hierarchy.
 * Useful when the `RunSynchronously` option is disabled but you want a specific action to be executed synchronously.
 */
export class SynchronousAction<A extends RawActionEntry> extends BaseAction {
	public constructor(public readonly RawAction: ActionLike<A> | ActionLikeArray<A>) {
		super();
	}

	protected OnConnected() {
		const action = transformAction<A>(this.RawAction);
		const connection = ActionConnection.From(action);

		action.SetContext(this.Context);

		connection.Triggered(() => {
			this.SetTriggered(true);
			(this.Changed as Signal).Fire();
		});

		connection.Released(() => {
			if (this.IsActive) {
				this.SetTriggered(false);
			}
			(this.Changed as Signal).Fire();
		});
	}
}

const actionMt = SynchronousAction as LuaMetatable<SynchronousAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Synchronous(${c.GetContentString().join(", ")})`;
