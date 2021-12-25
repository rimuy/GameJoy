import { AxisActionEntry } from "../Definitions/Types";

import { Action } from "./Action";
import { BaseAction } from "../Class/BaseAction";

import { ActionConnection } from "../Class/ActionConnection";

/**
 * Variant that provides support for inputs that have a continuous range.
 * The action is triggered everytime the input is changed.
 */
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

const actionMt = AxisAction as LuaMetatable<AxisAction<AxisActionEntry>>;
actionMt.__tostring = (c) => `Axis(${c.GetContentString()[0]})`;
