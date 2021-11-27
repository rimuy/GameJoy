import { Vec } from "@rbxts/rust-classes";

import { ActionConnection } from "../Util/ActionConnection";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { transformAction } from "../Util/transformAction";
import * as t from "../Util/TypeChecks";

export class SequenceAction<A extends RawActionEntry> extends BaseAction {
	private queue: Vec<A | ActionEntry<A> | Array<A | ActionEntry<A>>>;

	private canCancel;

	constructor(public readonly RawAction: Array<A | ActionEntry<A> | Array<A | ActionEntry<A>>>) {
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
					.all(([i, entry]) => RawAction[i] === entry)
			) {
				this.canCancel = true;

				if (size === rawActions.size()) {
					this.canCancel = false;
					return this.SetTriggered(true);
				}
			}

			if (this.IsPressed) this.SetTriggered((this.canCancel = false));
		});
	}

	protected OnConnected() {
		const { queue } = this;

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry, Action, Union);
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
