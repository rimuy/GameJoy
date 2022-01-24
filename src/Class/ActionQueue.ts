import { Option, Vec } from "@rbxts/rust-classes";
import { Bin } from "@rbxts/bin";
import Signal from "@rbxts/signal";

import { ActionEntry, ActionListener } from "../Definitions/Types";

import * as t from "../Util/TypeChecks";

interface QueueEntry {
	action: ActionEntry;
	bin: Bin;
	executable: () => Promise<Promise<void>>;
	isExecuting: boolean;
}

const { some: Some } = Option;

export class ActionQueue {
	private readonly updated;

	public readonly Entries;

	public constructor() {
		this.Entries = Vec.vec<QueueEntry>();
		this.updated = new Signal();

		this.updated.Connect(() => {
			this.Entries.first().andWith((entry) => {
				if (!entry.isExecuting) {
					entry.isExecuting = true;
					entry.executable();
				}

				return Some({});
			});
		});
	}

	private Reject({ bin, action }: QueueEntry) {
		bin.destroy();

		this.Remove(action);
		(action.Rejected as Signal).Fire();
	}

	public Add(action: ActionEntry, listener: ActionListener) {
		const { Entries, updated } = this;

		const bin = new Bin();

		const executable = () => {
			const execute = Promise.try(async () => {
				const result = listener();

				if (Promise.is(result)) {
					await result;
				}

				Entries.remove(0);
				(action.Resolved as Signal).Fire();
			});

			execute.finally(() => {
				bin.destroy();
				updated.Fire();
			});

			return execute;
		};

		const newEntry = {
			action,
			bin,
			executable,
			isExecuting: false,
		};

		Entries.push(newEntry);

		const i = Entries.len();

		if (i > 1) {
			if (t.isCancellableAction(action)) {
				bin.add(action.Cancelled.Connect(() => this.Reject(newEntry)));
			}
			bin.add(action.Released.Connect(() => this.Reject(newEntry)));
		} else {
			updated.Fire();
		}
	}

	private Remove(action: ActionEntry) {
		const { Entries, updated } = this;

		Entries.iter()
			.enumerate()
			.find(([, { action: x }]) => action === x)
			.andWith(([i]) => {
				Entries.remove(i);
				updated.Fire();
				return Some({});
			});
	}
}
