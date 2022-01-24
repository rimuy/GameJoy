import { Vec } from "@rbxts/rust-classes";
import Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, RawActionEntry, ConsumerSignal } from "../Definitions/Types";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";
import { isOptional } from "../Misc/IsOptional";

import * as t from "../Util/TypeChecks";

/**
 * Variant that requires all of its entries to be active in a specific order for it to trigger.
 */
export class SequenceAction<A extends RawActionEntry> extends BaseAction {
	private queue: Vec<ActionLike<A> | ActionLikeArray<A>>;

	private canCancel;

	public readonly Cancelled: ConsumerSignal;

	public constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();
		this.Cancelled = new Signal();

		const rawActions = RawAction.filter(
			(action) => !t.isAction(action) || !isOptional(action),
		);

		const queue = (this.queue = Vec.withCapacity(rawActions.size()));
		this.canCancel = false;

		ActionConnection.From(this).Changed(() => {
			const size = queue.len();

			if (
				size > 0 &&
				queue
					.iter()
					.enumerate()
					.all(([i, entry]) => RawAction[i] === entry)
			) {
				this.canCancel = true;

				if (size === rawActions.size()) {
					this.canCancel = false;
					return this.SetTriggered(true);
				}
			}

			if (this.IsActive) this.SetTriggered((this.canCancel = false));
		});
	}

	protected OnConnected() {
		const { queue } = this;

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry);
			const connection = ActionConnection.From(action);

			action.SetContext(this.Context);

			let began = false;

			connection.Triggered(() => {
				if (!isOptional(entry)) {
					queue.push(entry);
				}

				began = true;

				(this.Changed as Signal).Fire();
			});

			connection.Released(() => {
				const index = queue.asPtr().findIndex((x) => x === entry);

				if (began && index >= 0) {
					queue.remove(index);
				}

				began = false;

				if (this.canCancel) {
					this.canCancel = false;
					(this.Cancelled as Signal).Fire();
				}

				(this.Changed as Signal).Fire();
			});

			ActionConnection.From(this).Destroyed(() => {
				action.Destroy();
			});
		}
	}
}

const actionMt = SequenceAction as LuaMetatable<SequenceAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Sequence(${c.GetContentString().join(", ")})`;
