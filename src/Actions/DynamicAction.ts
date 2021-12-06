import Signal from "@rbxts/signal";

import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { ActionConnection } from "../Util/ActionConnection";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { transformAction } from "../Util/transformAction";
import * as t from "../Util/TypeChecks";

export class DynamicAction<A extends RawActionEntry> extends BaseAction {
	private CurrentConnection: ActionConnection | undefined;

	private ConnectAction(newAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		const action = transformAction<A>(newAction, Action, Union);
		const connection = ActionConnection.From(action);

		(this.RawAction as unknown) = action.RawAction;
		action.SetContext(this.Context);

		connection.Triggered(() => {
			if (!this.IsPressed) {
				this.SetTriggered(true);
				this.Changed.Fire();
			}
		});

		connection.Released(() => {
			if (this.IsPressed) {
				this.SetTriggered(false);
				this.Changed.Fire();
			}
		});

		connection.Cancelled(() => this.Cancelled.Fire());

		this.CurrentConnection = connection;
	}

	readonly Updated = new Signal();

	constructor(public readonly RawAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		super();

		ActionConnection.From(this).Destroyed(() => {
			this.CurrentConnection?.Destroy();
		});
	}

	protected OnConnected() {
		this.ConnectAction(this.RawAction);
	}

	Update(newAction: A | ActionEntry<A> | Array<A | ActionEntry<A>>) {
		if (!t.isValidActionEntry(newAction)) {
			error(debug.traceback("Invalid action entry."));
		} else if (!this.Context) {
			error(
				debug.traceback(
					"You can't update an action that doesn't belong to a context.",
				),
			);
		}

		this.CurrentConnection?.Destroy();
		this.ConnectAction(newAction);

		this.Updated.Fire();
	}
}
