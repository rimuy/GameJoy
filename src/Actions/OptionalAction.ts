import type Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, RawActionEntry } from "../definitions";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";

/**
 * Variant that is used to act as a "ghost" action when placed inside objects that accepts multiple entries.
 * Its parent action can trigger without the need of the action being active, and will trigger again once the action activates.
 */
export class OptionalAction<A extends RawActionEntry> extends BaseAction {
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
			this.SetTriggered(false);
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
		return new OptionalAction<A>(this.RawAction);
	}
}

const actionMt = OptionalAction as LuaMetatable<OptionalAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Optional(${c.GetContentString().join(", ")})`;
