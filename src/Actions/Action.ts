import Signal from "@rbxts/signal";

import { ActionConnection } from "../Util/ActionConnection";
import { BaseAction } from "../Class/BaseAction";
import { RawActionEntry } from "../Definitions/Types";

interface ActionOptions {
	Repeat?: number;
	Timing?: number;
}

export class Action<A extends RawActionEntry> extends BaseAction {
	constructor(public readonly RawAction: A, options: ActionOptions = {}) {
		super();

		const {
			Repeat = math.max(1, options.Repeat ?? 1),
			Timing = math.max(0, options.Timing ?? 0),
		} = options;

		const conn = this.Connected.Connect(() => {
			conn.Disconnect();

			const connection = ActionConnection.From(this);
			const newInputSignal = new Signal();

			let cancelled = true;
			let timesTriggered = 0;

			connection.Began(() => {
				cancelled = true;
				timesTriggered++;

				newInputSignal.Fire();
				this.Changed.Fire();

				new Promise<boolean>((resolve) => {
					if (Repeat > 1) newInputSignal.Wait();

					resolve(timesTriggered >= Repeat);
				})
					.timeout(Timing)
					.then(
						(isCompleted) => {
							if (isCompleted) {
								timesTriggered = 0;
								cancelled = false;
								this.SetTriggered(true);
							}
						},
						() => {
							timesTriggered = 0;
							if (cancelled) {
								this.Cancelled.Fire();
								this.SetTriggered(false);
							}
						},
					);
			});

			connection.Ended(() => {
				if (this.IsPressed && !cancelled) this.SetTriggered(false);
				if (Repeat === 1) this.Released.Fire(false);

				this.Changed.Fire();
			});

			connection.Destroyed(() => newInputSignal.Destroy());
		});
	}
}
