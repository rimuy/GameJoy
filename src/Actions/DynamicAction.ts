import Signal from "@rbxts/signal";

import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { ActionConnection } from "../Util/ActionConnection";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { MixedAction as Mixed } from "./MixedAction";

import { TransformAction } from "../Util/TransformAction";
import * as t from "../Util/TypeChecks";

export class DynamicAction<A extends RawActionEntry> extends BaseAction {
	private CurrentConnection: ActionConnection | undefined;

	private ConnectAction(newAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		const action = TransformAction<A>(newAction, Action, Mixed);
		const connection = ActionConnection.From(action);

		(this.RawAction as unknown) = action.RawAction;
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

		this.CurrentConnection = connection;
	}

	readonly Updated = new Signal();

	constructor(public readonly RawAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		super();

		const conn = this.Connected.Connect(() => {
			conn.Disconnect();
			this.ConnectAction(RawAction);
		});
	}

	Update(newAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		if (!t.isValidActionEntry(newAction)) {
			error(debug.traceback("Invalid action entry."));
		} else if (!this.Context) {
			error(debug.traceback("You can't update an action that doesn't belong to a context."));
		}

		this.CurrentConnection?.Destroy();
		this.ConnectAction(newAction);

		this.Updated.Fire();
	}
}
