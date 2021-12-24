import Signal from "@rbxts/signal";

import { ActionConnection } from "../Class/ActionConnection";
import aliases from "../Misc/Aliases";

import { BaseAction } from "../Class/BaseAction";

import { AliasKey, RawActionEntry } from "../Definitions/Types";

interface ActionOptions {
	Repeat?: number;
	Timing?: number;
}

export class Action<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: A, private options: ActionOptions = {}) {
		super();
		const alias = aliases.get(RawAction as AliasKey);

		if (alias) {
			this.RawAction = alias as A;
		}
	}

	protected OnConnected() {
		const { Repeat, Timing } = this.options;

		const repeatTimes = math.max(1, Repeat ?? 1);
		const timing = math.max(0, Timing ?? 0);
		const connection = ActionConnection.From(this);
		const newInputSignal = new Signal();

		let cancelled = true;
		let timesTriggered = 0;

		connection.Began(() => {
			cancelled = true;
			timesTriggered++;

			newInputSignal.Fire();
			this.Changed.Fire();

			new Promise<boolean>((resolve) => {
				if (repeatTimes > 1) newInputSignal.Wait();

				resolve(timesTriggered >= repeatTimes);
			})
				.timeout(timing)
				.then(
					(isCompleted) => {
						if (isCompleted) {
							timesTriggered = 0;
							cancelled = false;
							this.SetTriggered(true);
						}
					},
					() => {
						timesTriggered = 0;
						if (cancelled) {
							this.Cancelled.Fire();
							this.SetTriggered(false);
						}
					},
				);
		});

		connection.Ended(() => {
			if (this.IsPressed && !cancelled) {
				this.SetTriggered(false);
				// this.ActiveInputs.remove();
			}
			if (repeatTimes === 1) this.Released.Fire(false);

			this.Changed.Fire();
		});

		connection.Destroyed(() => newInputSignal.Destroy());
	}
}

const actionMt = Action as LuaMetatable<Action<RawActionEntry>>;
actionMt.__tostring = (c) => `Action(${c.GetContentString()[0]})`;
