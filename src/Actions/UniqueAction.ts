import { HashMap } from "@rbxts/rust-classes";
import type Signal from "@rbxts/signal";

import { ActionEntry, ActionLikeArray, RawActionEntry, SignalWithParams } from "../definitions";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";
import { isOptional } from "../Misc/IsOptional";

/**
 * Requires **only one** of its entries to be active for it to trigger.
 */
export class UniqueAction<A extends RawActionEntry> extends BaseAction {
	private current: ActionEntry<A> | undefined;

	private status: HashMap<ActionEntry<A>, boolean>;

	protected Parameters;

	public constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();

		const status = (this.status = HashMap.empty());
		this.Parameters = new Array<unknown>();

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry);
			if (isOptional(action)) {
				ActionConnection.From(action).Triggered(() =>
					(this.Triggered as unknown as SignalWithParams).Fire(
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
				this.current = status.keys().nth(0).unwrap();
				return this.SetTriggered(true, false, this.current);
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

	protected _GetLastParameters() {
		return [] as LuaTuple<[]>;
	}

	public Clone() {
		const newAction = new UniqueAction<A>(this.RawAction);
		newAction.Middleware = this.Middleware;
		newAction.OnTriggered = this.OnTriggered;

		return newAction;
	}
}

const actionMt = UniqueAction as LuaMetatable<UniqueAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Unique(${c.GetContentString().join(", ")})`;
