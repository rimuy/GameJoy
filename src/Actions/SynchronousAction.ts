import type Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, RawActionEntry } from "../definitions";

import { BaseAction } from "../Class/BaseAction";
import { ActionConnection } from "../Class/ActionConnection";

import { transformAction } from "../Misc/TransformAction";

/**
 * Variant that synchronizes its action when placed on the highest hierarchy.
 * Useful when the `RunSynchronously` option is disabled but you want a specific action to be executed synchronously.
 */
export class SynchronousAction<A extends RawActionEntry> extends BaseAction {
	protected Parameters;

	public constructor(public readonly RawAction: ActionLike<A> | ActionLikeArray<A>) {
		super();

		this.Parameters = new Array<unknown>();
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

		ActionConnection.From(this).Destroyed(() => {
			action.Destroy();
		});
	}

	protected _GetLastParameters() {
		return [] as LuaTuple<[]>;
	}

	public Clone() {
		return new SynchronousAction<A>(this.RawAction);
	}
}

const actionMt = SynchronousAction as LuaMetatable<SynchronousAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Synchronous(${c.GetContentString().join(", ")})`;
