import { Option, Vec } from "@rbxts/rust-classes";
import { Bin } from "@rbxts/bin";
import Signal from "@rbxts/signal";

import { ActionEntry } from "../Definitions/Types";

const { some: Some } = Option;

export class ActionQueue {
	private Queue: Vec<{
		Action: ActionEntry;
		Pending: () => Promise<void>;
		IsExecuting: boolean;
	}>;

	private Updated = new Signal();

	constructor() {
		this.Queue = Vec.vec();

		this.Updated.Connect(() => {
			this.Queue.first().andWith((entry) => {
				if (!entry.IsExecuting) {
					entry.IsExecuting = true;
					entry.Pending();
				}
				return Some({});
			});
		});
	}

	private Reject(bin: Bin, action: ActionEntry) {
		bin.destroy();

		this.Remove(action);
		action.Rejected.Fire();
	}

	Add(action: ActionEntry, listener: () => void | Promise<void>) {
		const { Queue, Updated } = this;

		if (!Queue.asPtr().some(({ Action: a }) => action === a)) {
			const bin = new Bin();

			const pending = () => {
				const execute = new Promise<void>((resolve) => {
					task.spawn(() => {
						listener();
						Queue.remove(0);
						action.Resolved.Fire();

						resolve();
					});
				});

				execute.then(() => {
					bin.destroy();
					Updated.Fire();
				});

				return execute;
			};

			Queue.push({
				Action: action,
				Pending: pending,
				IsExecuting: false,
			});

			const i = Queue.len();

			if (i > 1) {
				bin.add(action.Cancelled.Connect(() => this.Reject(bin, action)));
				bin.add(action.Released.Connect(() => this.Reject(bin, action)));
			}

			Updated.Fire();
		}
	}

	Remove(action: ActionEntry) {
		const { Queue, Updated } = this;

		Queue.iter()
			.enumerate()
			.find(([, { Action: a }]) => action === a)
			.andWith(([i]) => {
				Queue.remove(i);
				Updated.Fire();
				return Some({});
			});
	}
}
