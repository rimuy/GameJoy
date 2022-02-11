import { SignalWrapper, SignalConnection } from "../definitions";

import { Manual } from "../Actions";

import { ActionConnection } from "../Class/ActionConnection";

/**
 * Creates an action with an event connection.
 */
export function useEvent<S extends SignalWrapper>(signal: S) {
	type P = S extends SignalWrapper<infer F> ? Parameters<F> : never;

	const manual = new Manual<P>();
	let connection: SignalConnection;

	function trigger(...params: P) {
		manual.Trigger(...params);
	}

	if ("connect" in signal) {
		connection = signal.connect(trigger);
	} else if ("Connect" in signal) {
		connection = signal.Connect(trigger);
	} else {
		error(debug.traceback("Signal wrapper doesn't contain a valid connect method."));
	}

	ActionConnection.From(manual).Destroyed(() => {
		if (connection) {
			if ("disconnect" in connection) {
				connection.disconnect();
			} else if ("Disconnect" in connection) {
				connection.Disconnect();
			} else {
				error(
					debug.traceback(
						"Connection doesn't contain a valid disconnect method.",
					),
				);
			}
		}
	});

	return manual;
}
