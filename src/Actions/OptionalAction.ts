import { ActionConnection } from "../Util/ActionConnection";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { MixedAction as Mixed } from "./MixedAction";

import { TransformAction } from "../Util/TransformAction";

export class OptionalAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		super();

		const conn = this.Connected.Connect(() => {
			conn.Disconnect();

			const action = TransformAction<A>(RawAction, Action, Mixed);
			const connection = ActionConnection.From(action);

			action.SetContext(this.Context);

			connection.Triggered(() => {
				this.SetTriggered(true);
				this.Changed.Fire();
			});

			connection.Released(() => {
				this.SetTriggered(false, true);
				this.Changed.Fire();
			});
		});
	}
}
