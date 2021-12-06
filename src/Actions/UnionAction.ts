import { ActionConnection } from "../Util/ActionConnection";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";

import { transformAction } from "../Util/transformAction";

export class UnionAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: Array<A | ActionEntry<A> | Array<A | ActionEntry<A>>>) {
		super();
	}

	protected OnConnected() {
		const thisConnection = ActionConnection.From(this);

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry, Action, UnionAction);
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

			thisConnection.Destroyed(() => {
				connection.Destroy();
				this.Changed.Fire();
			});
		}
	}
}
