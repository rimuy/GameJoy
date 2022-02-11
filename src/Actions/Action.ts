import Signal from "@rbxts/signal";

import {
	ActionOptions,
	AliasKey,
	RawActionEntry,
	ConsumerSignal,
	SignalWithParams,
} from "../definitions";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import aliases from "../Misc/Aliases";

/**
 * Object that holds information about inputs that can be performed by the player while in a context.
 */
export class Action<A extends RawActionEntry> extends BaseAction {
	protected Parameters;

	public readonly Began: ConsumerSignal<(processed: boolean) => void>;

	public readonly Ended: ConsumerSignal<(processed: boolean) => void>;

	public readonly Cancelled: ConsumerSignal;

	public constructor(public readonly RawAction: A, private readonly options: ActionOptions = {}) {
		super();
		this.Parameters = new Array<unknown>();
		this.Began = new Signal();
		this.Ended = new Signal();
		this.Cancelled = new Signal();

		const alias = aliases.get(RawAction as AliasKey);

		if (alias) {
			this.RawAction = alias as A;
		}
	}

	protected OnConnected() {
		const { Repeat = 1, Timing = 0.3 } = this.options;

		const repeatTimes = math.max(1, Repeat);
		const timing = math.max(0, Timing);
		const connection = ActionConnection.From(this);
		const newInputSignal = new Signal();

		let cancelled = true;
		let timesTriggered = 0;

		connection.Began(() => {
			cancelled = true;
			timesTriggered++;

			newInputSignal.Fire();
			(this.Changed as Signal).Fire();

			new Promise<boolean>((resolve) => {
				if (repeatTimes > 1) newInputSignal.Wait();

				resolve(timesTriggered >= repeatTimes);
			})
				.timeout(timing)
				.then((isCompleted) => {
					if (isCompleted) {
						timesTriggered = 0;
						cancelled = false;
						this.SetTriggered(true);
					}
				})
				.catch(() => {
					timesTriggered = 0;
					if (cancelled) {
						(this.Cancelled as Signal).Fire();
						this.SetTriggered(false);
					}
				});
		});

		connection.Ended(() => {
			if (this.IsActive && !cancelled) {
				this.SetTriggered(false);
			}

			if (repeatTimes === 1) {
				(this.Released as unknown as SignalWithParams).Fire(false);
			}

			(this.Changed as Signal).Fire();
		});

		connection.Destroyed(() => newInputSignal.Destroy());
	}

	protected _GetLastParameters() {
		return [] as LuaTuple<[]>;
	}

	public Clone() {
		return new Action<A>(this.RawAction);
	}
}

const actionMt = Action as LuaMetatable<Action<RawActionEntry>>;
actionMt.__tostring = (c) => `Action(${c.GetContentString()[0] ?? ""})`;
