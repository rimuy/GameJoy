import { BaseAction } from "../Class/BaseAction";

import { SignalWithParams } from "../Definitions/Types";

/**
 * Variant that is used to act as a placeholder for manual triggering.
 */
export class ManualAction<P extends Array<unknown> = []> extends BaseAction {
	public readonly RawAction = [];

	public constructor() {
		super();
	}

	protected OnConnected() {}

	/**
	 * Triggers the action object with the given parameters.
	 */
	public Trigger(...params: P) {
		if (!this.Context) return;
		task.defer(() =>
			(this.Triggered as SignalWithParams).Fire(
				this.Context?.Options.Process,
				...params,
			),
		);
	}
}

const actionMt = ManualAction as LuaMetatable<ManualAction>;
actionMt.__tostring = () => "Manual";
