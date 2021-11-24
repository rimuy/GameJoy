import { ActionConnection } from "../Util/ActionConnection";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { TransformAction } from "../Util/TransformAction";

export class OptionalAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
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
	}
}
