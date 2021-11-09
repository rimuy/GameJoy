import { Option, Vec } from "@rbxts/rust-classes";
import { Bin } from "@rbxts/bin";
import Signal from "@rbxts/signal";

import { ActionEntry } from "../Definitions/Types";

const { some: Some } = Option;

export class ActionQueue {
	private queue: Vec<{
		action: ActionEntry;
		pending: () => Promise<void>;
		isExecuting: boolean;
	}>;

	private updated = new Signal();

	constructor() {
		this.queue = Vec.vec();

		this.updated.Connect(() => {
			this.queue.first().andWith((entry) => {
				if (!entry.isExecuting) {
					entry.isExecuting = true;
					entry.pending();
				}
				return Some({});
			});
		});
	}

	private reject(bin: Bin, action: ActionEntry, index: number) {
		bin.destroy();

		this.Remove(index);
		action.Rejected.Fire();
	}

	Add(action: ActionEntry, listener: () => void | Promise<void>) {
		const bin = new Bin();

		const pending = () => {
			const execute = new Promise<void>((resolve) => {
				task.spawn(() => {
					listener();
					this.queue.remove(0);
					action.Resolved.Fire();

					resolve();
				});
			});

			execute.then(() => {
				bin.destroy();
				this.updated.Fire();
			});

			return execute;
		};

		this.queue.push({
			action,
			pending,
			isExecuting: false,
		});

		const i = this.queue.len() - 1;

		if (i > 0) {
			bin.add(action.Cancelled.Connect(() => this.reject(bin, action, i)));
			bin.add(action.Released.Connect(() => this.reject(bin, action, i)));
		}

		this.updated.Fire();
	}

	Remove(index: number) {
		this.queue.get(index).andWith(() => {
			this.queue.remove(index);
			this.updated.Fire();
			return Some({});
		});
	}
}
