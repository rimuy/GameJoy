import { BaseAction } from "../Class/BaseAction";

import { tuple } from "../Misc/Tuple";

/**
 * Acts as a placeholder for manual triggering.
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
		const newAction = new ManualAction<P>();
		newAction.Middleware = this.Middleware;
		newAction.OnTriggered = this.OnTriggered;

		return newAction;
	}
}

const actionMt = ManualAction as LuaMetatable<ManualAction>;
actionMt.__tostring = () => "Manual";
