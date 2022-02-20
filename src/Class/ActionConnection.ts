import Signal from "@rbxts/signal";
import { UserInputService as IS } from "@rbxts/services";
import { Bin } from "@rbxts/bin";

import {
	ActionEntry,
	AxisActionEntry,
	AvailableAxisTypes,
	RawActionEntry,
	SignalWithParams,
} from "../definitions";

import * as t from "../Util/TypeChecks";

import { GamepadKind } from "../Misc/Entries";

import { translateKeyCode } from "../Misc/KeyboardLayout";

function checkInputs(
	action: ActionEntry,
	keyCode: Enum.KeyCode,
	inputType: Enum.UserInputType,
	processed: boolean,
	callback: (processed: boolean, ...args: Array<unknown>) => void,
) {
	const { Process } = action.Context!.Options;
	const rawAction = action.RawAction as RawActionEntry;

	if (
		t.isActionEqualTo(rawAction, keyCode, inputType) &&
		(Process === undefined || Process === processed)
	) {
		callback(processed);
	}
}

export class ActionConnection {
	private bin;

	private constructor(public Action: ActionEntry) {
		this.bin = new Bin();
		this.Destroyed(() => this.bin.destroy());
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _Connect(signal: Signal, callback: (...args: Array<any>) => void) {
		this.bin.add(signal.Connect(callback));
	}

	private _GetAxisVectorType(
		entry: AxisActionEntry,
		{ X = 0, Y = 0, Z = 0 }: { X?: number; Y?: number; Z?: number },
	) {
		if (t.isAxis2d(entry)) return new Vector2(X, Y);
		else if (t.isAxis1d(entry)) return Z;
		else if (t.isAxisGyro(entry) && IS.GyroscopeEnabled) return IS.GetDeviceRotation()[1];
	}

	private _TranslateKeyCode(keyCode: Enum.KeyCode) {
		return translateKeyCode(keyCode, this.Action.Context!.Options.KeyboardLayout);
	}

	public static From(action: ActionEntry) {
		return new ActionConnection(action);
	}

	public SendInputRequest(
		keyCode: Enum.KeyCode,
		inputType: Enum.UserInputType,
		processed: boolean,
		callback: (processed: boolean, ...args: Array<unknown>) => void,
	) {
		checkInputs(this.Action, keyCode, inputType, processed, callback);
	}

	public Began(callback: (processed: boolean) => void) {
		if (t.isEntryOfType(this.Action, "Action") && this.Action.IsBound()) {
			this._Connect(this.Action.Began as unknown as SignalWithParams, callback);
			this.bin.add(
				IS.InputBegan.Connect(({ KeyCode, UserInputType }, processed) =>
					this.SendInputRequest(
						this._TranslateKeyCode(KeyCode),
						UserInputType,
						processed,
						callback,
					),
				),
			);
		}
	}

	public Ended(callback: (processed: boolean) => void) {
		if (t.isEntryOfType(this.Action, "Action") && this.Action.IsBound()) {
			this._Connect(this.Action.Ended as unknown as SignalWithParams, callback);
			this.bin.add(
				IS.InputEnded.Connect(({ KeyCode, UserInputType }, processed) =>
					this.SendInputRequest(
						this._TranslateKeyCode(KeyCode),
						UserInputType,
						processed,
						callback,
					),
				),
			);
		}
	}

	public Destroyed(callback: () => void) {
		this._Connect(this.Action.Destroyed as Signal, callback);
	}

	public Triggered(callback: (processed: boolean, ...args: Array<unknown>) => void) {
		this._Connect(this.Action.Triggered as unknown as SignalWithParams, callback);
	}

	public Released(callback: (processed: boolean) => void) {
		this._Connect(this.Action.Released as unknown as SignalWithParams, callback);
	}

	public Changed(callback: () => void) {
		const { Action } = this;

		this._Connect((Action as unknown as { Changed: Signal }).Changed, callback);

		if (t.isEntryOfType(Action, "AxisAction")) {
			this.bin.add(
				IS.InputChanged.Connect(
					({ Delta, KeyCode, UserInputType, Position }, processed) => {
						if (!this.Action.IsBound()) return;

						const axisEntry = Action.RawAction;
						const keyCode = this._TranslateKeyCode(KeyCode);

						if (
							t.isActionEqualTo(
								axisEntry,
								keyCode,
								UserInputType,
							)
						) {
							const actionMembers = Action as unknown as {
								Delta: AvailableAxisTypes;
								Position: AvailableAxisTypes;
								Gamepad: GamepadKind;
							};

							actionMembers.Delta = this._GetAxisVectorType(
								axisEntry,
								Delta,
							);
							actionMembers.Position = this._GetAxisVectorType(
								axisEntry,
								Position,
							);
							actionMembers.Gamepad = (UserInputType.Name in
							(GamepadKind as { [x: string]: unknown })
								? UserInputType.Name
								: "None") as unknown as GamepadKind;

							this.SendInputRequest(
								keyCode,
								UserInputType,
								processed,
								callback,
							);
						}
					},
				),
			);
		}
	}

	public Cancelled(callback: () => void) {
		if (t.isCancellableAction(this.Action)) {
			this._Connect(this.Action.Cancelled as Signal, callback);
		}
	}

	public Destroy() {
		this.Action.Destroy();
	}
}
