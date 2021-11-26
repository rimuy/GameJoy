import { AxisActionEntry, RawActionEntry } from "../Definitions/Types";

import { Action } from "./Action";
import { BaseAction } from "../Class/BaseAction";

import { ActionConnection } from "../Util/ActionConnection";

export class AxisAction<A extends AxisActionEntry> extends BaseAction {
	readonly Delta;

	readonly Position;

	readonly KeyCode: Enum.KeyCode;

	constructor(public readonly RawAction: A) {
		super();

		this.Delta = new Vector3();
		this.Position = new Vector3();
		this.KeyCode = Enum.KeyCode.Unknown;
	}

	protected OnConnected() {
		const action = new Action<A>(this.RawAction);
		const connection = ActionConnection.From(action);
		const thisConnection = ActionConnection.From(this);

		action.SetContext(this.Context);

		connection.Changed(() => this.Changed.Fire());

		thisConnection.Changed(() => {
			this.SetTriggered(true);
			this.SetTriggered(false, true);
		});

		thisConnection.Destroyed(() => {
			action.Destroy();
		});
	}
}
