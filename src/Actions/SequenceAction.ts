import { Vec } from "@rbxts/rust-classes";

import { ActionConnection } from "../Class/ActionConnection";
import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { TransformAction } from "../Misc/TransformAction";
import * as t from "../Util/TypeChecks";

/**
 * Variant that requires all of its entries to be active in a specific order for it to trigger.
 */
export class SequenceAction<A extends RawActionEntry> extends BaseAction {
	private queue: Vec<ActionLike<A> | ActionLikeArray<A>>;

	private canCancel;

	constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();

		const rawActions = RawAction.filter(
			(action) => !t.isAction(action) || !t.actionEntryIs(action, "OptionalAction"),
		);

		const queue = (this.queue = Vec.withCapacity(rawActions.size()));
		this.canCancel = false;

		ActionConnection.From(this).Changed(() => {
			const size = queue.asPtr().size();

			if (
				size > 0 &&
				queue
					.iter()
					.enumerate()
					.all(
						([i, entry]) =>
							RawAction[i] === entry ||
							t.actionEntryIs(RawAction[i], "OptionalAction"),
					)
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
			const action = TransformAction<A>(entry, Action, Union);
			const connection = ActionConnection.From(action);

			action.SetContext(this.Context);

			let began = false;

			connection.Triggered(() => {
				if (!t.actionEntryIs(entry, "OptionalAction")) queue.push(entry);
				began = true;

				this.Changed.Fire();
			});

			connection.Released(() => {
				const index = queue.asPtr().findIndex((e) => e === entry);
				if (began && index >= 0) queue.remove(index);

				began = false;

				if (this.canCancel) {
					this.canCancel = false;
					this.Cancelled.Fire();
				}

				this.Changed.Fire();
			});

			ActionConnection.From(this).Destroyed(() => {
				action.Destroy();
			});
		}
	}
}

const actionMt = SequenceAction as LuaMetatable<SequenceAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Sequence(${c.GetContentString().join(", ")})`;
