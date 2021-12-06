import { ActionEntry, ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";

import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";
import { BaseAction } from "../Class/BaseAction";

import { ActionConnection } from "../Util/ActionConnection";
import { transformAction } from "../Util/transformAction";

export class MiddlewareAction<A extends RawActionEntry> extends BaseAction {
	constructor(
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
		const action = transformAction<A>(this.RawAction, Action, Union);
		const connection = ActionConnection.From(action);

		action.SetContext(this.Context);

		connection.Triggered(() => {
			if (this.Middleware(this)) {
				this.SetTriggered(true);
			}
			this.Changed.Fire();
		});

		connection.Released(() => {
			if (this.IsPressed) {
				this.Cancelled.Fire();
				this.SetTriggered(false);
			}
			this.Changed.Fire();
		});
	}
}
