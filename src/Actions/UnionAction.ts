import { ActionConnection } from "../Util/ActionConnection";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";

import { TransformAction } from "../Util/TransformAction";

export class UnionAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: Array<A | ActionEntry<A> | Array<A | ActionEntry<A>>>) {
		super();

		const conn = this.Connected.Connect(() => {
			conn.Disconnect();

			for (const entry of RawAction) {
				const action = TransformAction<A>(entry, Action, UnionAction);
				const connection = ActionConnection.From(action);

				action.SetContext(this.Context);

				connection.Triggered(() => {
					this.SetTriggered(true);
					this.Changed.Fire();
				});

				connection.Released(() => {
					if (this.IsPressed) {
						this.Cancelled.Fire();
						this.SetTriggered(false);
					}
					this.Changed.Fire();
				});
			}
		});
	}
}
