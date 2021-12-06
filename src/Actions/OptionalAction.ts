import { ActionConnection } from "../Util/ActionConnection";
import { ActionLike, ActionLikeArray, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";
import { Action } from "./Action";
import { UnionAction as Union } from "./UnionAction";

import { transformAction } from "../Util/transformAction";

export class OptionalAction<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: ActionLike<A> | ActionLikeArray<A>) {
		super();
	}

	protected OnConnected() {
		const action = transformAction<A>(this.RawAction, Action, Union);
		const connection = ActionConnection.From(action);

		action.SetContext(this.Context);

		connection.Triggered(() => {
			this.SetTriggered(true);
			this.Changed.Fire();
		});

		connection.Released(() => {
			this.SetTriggered(false);
			this.Changed.Fire();
		});

		ActionConnection.From(this).Destroyed(() => {
			action.Destroy();
		});
	}
}
