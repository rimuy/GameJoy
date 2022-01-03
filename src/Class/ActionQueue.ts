import { Option, Vec } from "@rbxts/rust-classes";
import { Bin } from "@rbxts/bin";
import Signal from "@rbxts/signal";

import { ActionEntry, ActionListener } from "../Definitions/Types";

interface QueueEntry {
	Action: ActionEntry;
	Bin: Bin;
	Executable: () => Promise<Promise<void>>;
	IsExecuting: boolean;
}

const { some: Some } = Option;

export class ActionQueue {
	private IsPending;

	private Updated;

	private Pending;

	private Queue;

	constructor() {
		this.IsPending = false;
		this.Updated = new Signal();
		this.Pending = Vec.vec<[ActionEntry, ActionListener]>();
		this.Queue = Vec.vec<QueueEntry>();

		this.Updated.Connect(() => {
			this.Queue.first().andWith((entry) => {
				if (!entry.IsExecuting) {
					entry.IsExecuting = true;
					entry.Executable();
				}

				return Some({});
			});
		});
	}

	private Reject({ Bin, Action }: QueueEntry) {
		Bin.destroy();

		this.Remove(Action);
		Action.Rejected.Fire();
	}

	Add(action: ActionEntry, ghostingCap: number, listener: ActionListener) {
		const { Updated, Queue, Pending } = this;

		if (Queue.asPtr().some(({ Action: a }) => action === a)) {
			return;
		}

		Pending.push([action, listener]);

		if (this.IsPending) {
			return;
		}

		this.IsPending = true;

		task.defer(() => {
			const ghostingLevel = Pending.iter()
				.enumerate()
				.map(([i, [x]]) => {
					const nextAction = Pending.asPtr()[i + 1];

					return nextAction
						? x
								.GetActiveInputs()
								.filter((rawAction) =>
									nextAction[0]
										.GetActiveInputs()
										.some(
											(r) =>
												rawAction ===
												r,
										),
								)
								.size()
						: 0;
				})
				.fold(0, (acc, i) => acc + i);

			if (ghostingCap <= 0 || ghostingLevel <= ghostingCap) {
				const [chosenAction, chosenListener] = Pending.iter()
					.maxByKey(([x]) => x.GetActiveInputs().size())
					.expect(
						"Error while unwraping the chosen action. Vec may be empty.",
					);

				const bin = new Bin();

				const exe = () => {
					const execute = Promise.try(async () => {
						const result = chosenListener();

						if (Promise.is(result)) {
							await result;
						}

						Queue.remove(0);
						chosenAction.Resolved.Fire();
					});

					execute.finally(() => {
						bin.destroy();
						Updated.Fire();
					});

					return execute;
				};

				const newEntry = {
					Action: chosenAction,
					Bin: bin,
					Executable: exe,
					IsExecuting: false,
				};

				Queue.push(newEntry);

				const i = Queue.len();

				if (i > 1) {
					bin.add(
						chosenAction.Cancelled.Connect(() =>
							this.Reject(newEntry),
						),
					);
					bin.add(
						chosenAction.Released.Connect(() =>
							this.Reject(newEntry),
						),
					);
				} else {
					Updated.Fire();
				}
			}

			Pending.clear();
			this.IsPending = false;
		});
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
