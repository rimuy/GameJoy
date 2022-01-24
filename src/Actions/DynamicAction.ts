import Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, AnyAction, AxisActionEntry } from "../Definitions/Types";

import { ActionConnection } from "../Class/ActionConnection";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

/**
 * Variant that accepts any action as a parameter and can be updated.
 *
 * It has an `Update` method and a `.Updated` signal that fires whenever it's updated.
 */
export class DynamicAction<A extends AnyAction> extends BaseAction {
	private currentConnection: ActionConnection | undefined;

	public readonly Updated;

	public constructor(
		public readonly RawAction: AxisActionEntry | ActionLike<A> | ActionLikeArray<A>,
	) {
		super();
		this.Updated = new Signal();

		ActionConnection.From(this).Destroyed(() => {
			this.currentConnection?.Action.Destroy();
		});
	}

	private ConnectAction(newAction: AxisActionEntry | ActionLike<A> | ActionLikeArray<A>) {
		const action = transformAction<A>(newAction);
		(this.RawAction as unknown) = action.RawAction;

		this.LoadContent();

		if (this.Context) {
			const connection = ActionConnection.From(action);
			action.SetContext(this.Context);

			connection.Triggered(() => {
				this.SetTriggered(true);
				(this.Changed as Signal).Fire();
			});

			connection.Released(() => {
				if (this.IsActive) {
					this.SetTriggered(false);
					(this.Changed as Signal).Fire();
				}
			});

			this.currentConnection = connection;
		}
	}

	protected OnConnected() {
		this.ConnectAction(this.RawAction);
	}

	/**
	 * Deactivates and updates the current action.
	 */
	public Update(newAction: AxisActionEntry | ActionLike<A> | ActionLikeArray<A>) {
		if (!t.isValidActionEntry(newAction)) {
			error(debug.traceback("Invalid action entry."));
		}

		this.SetTriggered(false);
		this.currentConnection?.Destroy();
		this.ConnectAction(newAction);

		this.Updated.Fire();
	}
}

const actionMt = DynamicAction as LuaMetatable<DynamicAction<AnyAction>>;
actionMt.__tostring = (c) => `Dynamic(${c.GetContentString().join(", ")})`;
