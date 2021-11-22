import { Result } from "@rbxts/rust-classes";
import Signal from "@rbxts/signal";
import { UserInputService as IS } from "@rbxts/services";
import { Bin } from "@rbxts/bin";

import { ActionEntry, RawActionEntry } from "../Definitions/Types";

import * as t from "./TypeChecks";

const { ok: Ok } = Result;

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

	private lastInputPosition;

	private constructor(private action: ActionEntry) {
		this.bin = new Bin();
		this.lastInputPosition = new Vector3();

		this.bin.add(
			action.Destroyed.Connect(() => {
				this.bin.destroy();
				this.action.SetContext(undefined);
			}),
		);
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
		checkInputs(this.action, keyCode, inputType, processed, callback);
	}

	Began(callback: (processed: boolean) => void) {
		this.Connect(this.action.Began, callback);
		this.bin.add(
			IS.InputBegan.Connect(({ KeyCode, UserInputType }, processed) =>
				this.SendInputRequest(KeyCode, UserInputType, processed, callback),
			),
		);
	}

	Ended(callback: (processed: boolean) => void) {
		this.Connect(this.action.Ended, callback);
		this.bin.add(
			IS.InputEnded.Connect(({ KeyCode, UserInputType }, processed) =>
				this.SendInputRequest(KeyCode, UserInputType, processed, callback),
			),
		);
	}

	Destroyed(callback: () => void) {
		this.Connect(this.action.Destroyed, callback);
	}

	Triggered(callback: (processed?: boolean) => void) {
		this.Connect(this.action.Triggered, callback);
	}

	Released(callback: (processed?: boolean) => void) {
		this.Connect(this.action.Released, callback);
	}

	Changed(callback: () => void) {
		const { action } = this;

		this.Connect(action.Changed, callback);

		if (t.ActionEntryIs(action, "AxisAction")) {
			this.bin.add(
				IS.InputChanged.Connect(
					({ Delta, KeyCode, UserInputType, Position }, processed) => {
						if (
							t.isActionEqualTo(
								action.RawAction,
								KeyCode,
								UserInputType,
							)
						) {
							(action.Delta as Vector3) = Delta;
							(action.Position as Vector3) = Position;
							(action.KeyCode as Enum.KeyCode) = KeyCode;

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
		this.Connect(this.action.Cancelled, callback);
	}

	Destroy() {
		this.action.Destroyed.Fire();
	}
}
