import Signal from "@rbxts/signal";
import { UserInputService as IS } from "@rbxts/services";
import { Bin } from "@rbxts/bin";

import { ActionEntry, RawActionEntry, SignalWithParams } from "../Definitions/Types";

import * as t from "../Util/TypeChecks";

function checkInputs(
	action: ActionEntry,
	keyCode: Enum.KeyCode,
	inputType: Enum.UserInputType,
	processed: boolean,
	callback: (processed: boolean, ...args: Array<unknown>) => void,
) {
	const context = action.Context;

	if (context) {
		const { Process } = context.Options;

		const rawAction = action.RawAction as RawActionEntry;

		if (
			t.isActionEqualTo(rawAction, keyCode, inputType) &&
			(Process === undefined || Process === processed)
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
		if (t.actionEntryIs(this.Action, "Action")) {
			this.Connect(this.Action.Began as unknown as SignalWithParams, callback);
			this.bin.add(
				IS.InputBegan.Connect(({ KeyCode, UserInputType }, processed) =>
					this.SendInputRequest(
						KeyCode,
						UserInputType,
						processed,
						callback,
					),
				),
			);
		}
	}

	public Ended(callback: (processed: boolean) => void) {
		if (t.actionEntryIs(this.Action, "Action")) {
			this.Connect(this.Action.Ended as unknown as SignalWithParams, callback);
			this.bin.add(
				IS.InputEnded.Connect(({ KeyCode, UserInputType }, processed) =>
					this.SendInputRequest(
						KeyCode,
						UserInputType,
						processed,
						callback,
					),
				),
			);
		}
	}

	public Destroyed(callback: () => void) {
		this.Connect(this.Action.Destroyed as Signal, callback);
	}

	public Triggered(callback: (processed?: boolean, ...args: Array<unknown>) => void) {
		this.Connect(this.Action.Triggered as SignalWithParams, callback);
	}

	public Released(callback: (processed?: boolean) => void) {
		this.Connect(this.Action.Released as unknown as SignalWithParams, callback);
	}

	public Changed(callback: () => void) {
		const { Action } = this;

		this.Connect((Action as unknown as { Changed: Signal }).Changed, callback);

		if (t.actionEntryIs(Action, "AxisAction")) {
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

	public Cancelled(callback: () => void) {
		if (t.isCancellableAction(this.Action)) {
			this.Connect(this.Action.Cancelled as Signal, callback);
		}
	}

	public Destroy() {
		this.Action.Destroy();
	}
}
