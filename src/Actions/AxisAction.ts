import type Signal from "@rbxts/signal";

import { AxisActionEntry, Axis1d, Axis2d, Gyroscope, MemberType } from "../definitions";

import { Action } from "./Action";
import { BaseAction } from "../Class/BaseAction";

import { ActionConnection } from "../Class/ActionConnection";

import { GamepadKind } from "../Misc/Entries";

import type { numberAxisTypes, vector2AxisTypes } from "../Misc/Entries";

import { tuple } from "../Misc/Tuple";

/**
 * Variant that provides support for inputs that have a continuous range.
 * The action is triggered everytime the input is changed.
 */
export class AxisAction<
	A extends AxisActionEntry,
	V = A extends typeof numberAxisTypes[number]
		? Axis1d
		: A extends typeof vector2AxisTypes[number]
		? Axis2d
		: A extends CastsToEnum<Enum.UserInputType.Gyro>
		? Gyroscope
		: never,
> extends BaseAction {
	protected Parameters;

	private readonly Delta: MemberType<V>;

	private readonly Position: MemberType<V>;

	private readonly Gamepad: GamepadKind;

	public constructor(public readonly RawAction: A) {
		super();

		this.Parameters = new Array<unknown>();
		this.Delta = {} as MemberType<V>;
		this.Position = {} as MemberType<V>;
		this.Gamepad = GamepadKind.None;
	}

	protected OnConnected() {
		const action = new Action<A>(this.RawAction);
		const connection = ActionConnection.From(action);
		const thisConnection = ActionConnection.From(this);

		action.SetContext(this.Context);

		connection.Changed(() => (this.Changed as Signal).Fire());

		thisConnection.Changed(() => {
			this.SetTriggered(true, false, ...this._GetLastParameters());
			this.SetTriggered(false, true);
		});

		thisConnection.Destroyed(() => {
			action.Destroy();
		});
	}

	protected _GetLastParameters() {
		return tuple(this.Position, this.Delta, this.Gamepad);
	}

	public Clone() {
		return new AxisAction<A>(this.RawAction);
	}
}

const actionMt = AxisAction as LuaMetatable<AxisAction<AxisActionEntry>>;
actionMt.__tostring = (c) => `Axis(${c.GetContentString()[0] ?? ""})`;
