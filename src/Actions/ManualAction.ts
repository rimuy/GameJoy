import { BaseAction } from "../Class/BaseAction";
import { ActionConnection } from "../Class/ActionConnection";

import { transformAction } from "../Misc/TransformAction";

import { tuple } from "../Misc/Tuple";

import { ActionLike, ActionLikeArray, RawActionEntry } from "../definitions";

/**
 * Variant that is used to act as a placeholder for manual triggering.
 */
export class ManualAction<P extends Array<unknown> = []> extends BaseAction {
	protected Parameters;

	public readonly RawAction: Array<never>;

	public constructor() {
		super();

		this.Parameters = [] as unknown as P;
		this.RawAction = [];
	}

	protected OnConnected() {}

	protected _GetLastParameters() {
		return tuple(...this.Parameters);
	}

	/**
	 * Triggers the action object with the given parameters.
	 */
	public Trigger(...params: P) {
		if (!this.Context) return;

		this.Parameters = params;

		task.defer(() => {
			this.SetTriggered(true, false, ...params);
			this.SetTriggered(false);
		});
	}

	public Clone() {
		return new ManualAction<P>();
	}
}

const actionMt = ManualAction as LuaMetatable<ManualAction>;
actionMt.__tostring = () => "Manual";
