import type Signal from "@rbxts/signal";

import { ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";

/**
 * Variant that accepts multiple entries as a parameter.
 */
export class UnionAction<A extends RawActionEntry> extends BaseAction {
	public constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();
	}

	protected OnConnected() {
		const thisConnection = ActionConnection.From(this);

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry);
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

			thisConnection.Destroyed(() => {
				action.Destroy();
				(this.Changed as Signal).Fire();
			});
		}
	}
}

const actionMt = UnionAction as LuaMetatable<UnionAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Union(${c.GetContentString().join(", ")})`;
