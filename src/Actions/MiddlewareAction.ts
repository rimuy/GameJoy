import type Signal from "@rbxts/signal";

import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import { BaseAction } from "../Class/BaseAction";
import { ActionConnection } from "../Class/ActionConnection";

import { transformAction } from "../Misc/TransformAction";

/**
 * Variant that accepts a callback that can be used to set a condition to your action.
 */
export class MiddlewareAction<A extends RawActionEntry> extends BaseAction {
	public constructor(
		public readonly RawAction: ActionLike<A> | ActionLikeArray<A>,
		middleware: (action: MiddlewareAction<A>) => boolean,
	) {
		super();
		this.Middleware = function (this: MiddlewareAction<A>) {
			return middleware(this);
		};
	}

	private Middleware(_action: MiddlewareAction<A>) {
		return false;
	}

	protected OnConnected() {
		const action = transformAction<A>(this.RawAction);
		const connection = ActionConnection.From(action);

		action.SetContext(this.Context);

		connection.Triggered(() => {
			if (this.Middleware(this)) {
				this.SetTriggered(true);
			}
			(this.Changed as Signal).Fire();
		});

		connection.Released(() => {
			if (this.IsActive) {
				this.SetTriggered(false);
			}
			(this.Changed as Signal).Fire();
		});
	}
}

const actionMt = MiddlewareAction as LuaMetatable<MiddlewareAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Middleware(${c.GetContentString().join(", ")})`;
