import { HashMap } from "@rbxts/rust-classes";
import type Signal from "@rbxts/signal";

import { ActionEntry, ActionLikeArray, RawActionEntry, SignalWithParams } from "../Definitions/Types";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";
import { isOptional } from "../Misc/IsOptional";

/**
 * Variant that requires **only one** of its entries to be active for it to trigger.
 */
export class UniqueAction<A extends RawActionEntry> extends BaseAction {
	private status: HashMap<ActionEntry<A>, boolean>;

	public constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();

		const status = (this.status = HashMap.empty());

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry);
			if (isOptional(action)) {
				ActionConnection.From(action).Triggered(() =>
					(this.Triggered as SignalWithParams).Fire(
						this.Context!.Options.Process,
					),
				);
			} else {
				status.insert(action, false);
			}
		}

		ActionConnection.From(this).Changed(() => {
			const count = status
				.values()
				.filter((isPressed): isPressed is true => isPressed)
				.count();

			if (!this.IsActive && count === 1) {
				return this.SetTriggered(true);
			}

			if (this.IsActive && count === 0) this.SetTriggered(false);
		});
	}

	protected OnConnected() {
		const { status } = this;

		status.keys().forEach((action) => {
			const connection = ActionConnection.From(action);

			action.SetContext(this.Context);

			connection.Triggered(() => {
				status.insert(action, true);

				(this.Changed as Signal).Fire();
			});

			connection.Released(() => {
				status.insert(action, false);

				(this.Changed as Signal).Fire();
			});

			ActionConnection.From(this).Destroyed(() => {
				action.Destroy();
			});
		});
	}
}

const actionMt = UniqueAction as LuaMetatable<UniqueAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Unique(${c.GetContentString().join(", ")})`;
