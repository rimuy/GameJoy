import Signal from "@rbxts/signal";
import { UserInputService as IS } from "@rbxts/services";
import { Bin } from "@rbxts/bin";

import { ActionEntry, RawActionEntry } from "../Definitions/Types";

import * as t from "./TypeChecks";

function checkInputs(
	action: ActionEntry,
	keyCode: Enum.KeyCode,
	inputType: Enum.UserInputType,
	processed: boolean,
	callback: (processed: boolean) => void,
) {
	const context = action.Context;

	if (context) {
		const { Process } = context.Options ?? {};

		const RawAction = action.RawAction as RawActionEntry;

		if (
			t.isActionEqualTo(RawAction, keyCode, inputType) &&
			(Process === undefined ||
				Process === processed ||
				keyCode === Enum.KeyCode.Thumbstick1 ||
				keyCode === Enum.KeyCode.Thumbstick2)
		) {
			callback(processed);
		}
	}
}

export class ActionConnection {
	private bin;

	private constructor(public Action: ActionEntry) {
		this.bin = new Bin();
		this.Destroyed(() => this.bin.destroy());
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private Connect(signal: Signal, callback: (...args: Array<any>) => void) {
		this.bin.add(signal.Connect(callback));
	}

	static From(action: ActionEntry) {
		return new ActionConnection(action);
	}

	SendInputRequest(
		keyCode: Enum.KeyCode,
		inputType: Enum.UserInputType,
		processed: boolean,
		callback: (processed: boolean) => void,
	) {
		checkInputs(this.Action, keyCode, inputType, processed, callback);
	}

	Began(callback: (processed: boolean) => void) {
		this.Connect(this.Action.Began, callback);
		this.bin.add(
			IS.InputBegan.Connect(({ KeyCode, UserInputType }, processed) =>
				this.SendInputRequest(KeyCode, UserInputType, processed, callback),
			),
		);
	}

	Ended(callback: (processed: boolean) => void) {
		this.Connect(this.Action.Ended, callback);
		this.bin.add(
			IS.InputEnded.Connect(({ KeyCode, UserInputType }, processed) =>
				this.SendInputRequest(KeyCode, UserInputType, processed, callback),
			),
		);
	}

	Destroyed(callback: () => void) {
		this.Connect(this.Action.Destroyed, callback);
	}

	Triggered(callback: (processed?: boolean) => void) {
		this.Connect(this.Action.Triggered, callback);
	}

	Released(callback: (processed?: boolean) => void) {
		this.Connect(this.Action.Released, callback);
	}

	Changed(callback: () => void) {
		const { Action } = this;

		this.Connect(Action.Changed, callback);

		if (t.ActionEntryIs(Action, "AxisAction")) {
			this.bin.add(
				IS.InputChanged.Connect(
					({ Delta, KeyCode, UserInputType, Position }, processed) => {
						if (
							t.isActionEqualTo(
								Action.RawAction,
								KeyCode,
								UserInputType,
							)
						) {
							(Action.Delta as Vector3) = Delta;
							(Action.Position as Vector3) = Position;
							(Action.KeyCode as Enum.KeyCode) = KeyCode;

							this.SendInputRequest(
								KeyCode,
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

	Cancelled(callback: () => void) {
		this.Connect(this.Action.Cancelled, callback);
	}

	Destroy() {
		this.Action.Destroy();
	}
}
