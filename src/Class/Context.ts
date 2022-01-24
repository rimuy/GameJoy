import { RunService } from "@rbxts/services";
import { HashMap, Option, Result, Vec } from "@rbxts/rust-classes";

import { ActionQueue } from "./ActionQueue";

import { ActionConnection } from "./ActionConnection";

import {
	ActionEntry,
	ActionLike,
	ActionLikeArray,
	ActionListener,
	ContextOptions,
	RawActionEntry,
	SignalWrapper,
	SignalConnection,
} from "../Definitions/Types";

import { Manual, Sync } from "../Actions";

import { transformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

interface Options extends Required<Omit<ContextOptions, "Process">> {
	Process?: boolean;
}

const { ok: Ok } = Result;
const { some: Some } = Option;

/* eslint-disable prettier/prettier */
const ACTION_UNWRAP_ERROR = "An error occurred while trying to unwrap action.";
const CHOSEN_ACTION_UNWRAP_ERROR = "Error while unwraping the chosen action. Vec may be empty.";
const ACTION_REMOVAL_WARNING = debug.traceback("The specified action is not bound to this context.");
const SIGNAL_NO_CONNECT_METHOD_ERROR = debug.traceback("Signal wrapper doesn't contain a valid connect method.");
const SIGNAL_CONNECTION_NO_DISCONNECT_METHOD_ERROR = debug.traceback("Connection doesn't contain a valid disconnect method.");
const EVENT_NOT_BOUND_WARNING = (event: string) => debug.traceback(`"${event}" event is not bound to this context.`);
/* eslint-enable prettier/prettier */

const defaultOptions: Options = {
	ActionGhosting: 0,
	OnBefore: () => true,
	RunSynchronously: false,
};

const rustWarn = (...params: Array<unknown>) => {
	warn(...params);
	return {};
};

/**
 * Object responsible for storing and managing bound actions.
 *
 * `ActionGhosting`:
 * Limits the amount of actions that can trigger if those have any raw action in common. If set to 0, this property will be ignored.
 *
 * `OnBefore`:
 * Applies a check on every completed action. If the check fails, the action won't be triggered.
 *
 * `Process`:
 * Specifies that the action should trigger if gameProcessedEvent matches the setting. If nothing is passed, the action will trigger independently.
 *
 * `RunSynchronously`:
 * Specifies if the actions are going to run synchronously or not.
 * This will ignore the action queue and resolve the action instantly.
 */
export class Context<O extends ContextOptions> {
	private actions: HashMap<ActionEntry, ActionListener<Array<unknown>>>;

	private events: HashMap<
		string,
		{ action: Manual | Sync<RawActionEntry>; connection: SignalConnection }
	>;

	private pending: Vec<[ActionEntry, ActionListener]>;

	private isPending;

	private queue;

	public readonly Options: Options;

	public constructor(options?: O) {
		if (!RunService.IsClient()) {
			error(
				debug.traceback(
					`${getmetatable(this)} can only be instantied on the client.`,
				),
			);
		}

		this.Options = { ...defaultOptions, ...options };

		this.actions = HashMap.empty();
		this.events = HashMap.empty();
		this.pending = Vec.vec();
		this.isPending = false;
		this.queue = new ActionQueue();
	}

	private ConnectAction<A extends RawActionEntry>(action: ActionEntry<A>) {
		const { actions, pending, queue } = this;
		const { RunSynchronously: isSync, OnBefore, ActionGhosting: ghostingCap } = this.Options;

		action.SetContext(this);
		const connection = ActionConnection.From(action);

		connection.Triggered((_, ...args) => {
			const listener = () => actions.get(action).expect(ACTION_UNWRAP_ERROR)(...args);

			if (OnBefore() === true) {
				pending.push([action, listener]);

				if (this.isPending) return;

				this.isPending = true;

				task.defer(() => {
					const ghostingLevel = pending
						.iter()
						.enumerate()
						.map(([i, [x]]) => {
							const nextAction = pending.asPtr()[i + 1];

							return nextAction
								? x
										.GetActiveInputs()
										.filter((rawAction) =>
											nextAction[0]
												.GetActiveInputs()
												.some(
													(
														r,
													) =>
														rawAction ===
														r,
												),
										)
										.size()
								: 0;
						})
						.fold(0, (acc, i) => acc + i);

					if (ghostingCap <= 0 || ghostingLevel <= ghostingCap) {
						const [chosenAction, chosenListener] = pending
							.iter()
							.maxByKey(([x]) => x.GetActiveInputs().size())
							.expect(CHOSEN_ACTION_UNWRAP_ERROR);

						if (
							isSync === true ||
							t.actionEntryIs(
								chosenAction,
								"SynchronousAction",
							)
						) {
							chosenListener();
						} else if (
							!queue.Entries.iter().any(
								({ action: x }) => action === x,
							)
						) {
							queue.Add(chosenAction, chosenListener);
						}
					}

					pending.clear();
					this.isPending = false;
				});
			}
		});

		connection.Destroyed(() => {
			this.Unbind(action);
		});
	}

	private RemoveAction(actionOpt: Option<ActionEntry>) {
		return actionOpt.okOr(rustWarn(ACTION_REMOVAL_WARNING)).map((action) => {
			this.actions.remove(action);
			action.Destroy();
		});
	}

	/**
	 * Checks if a certain action is bound to the context.
	 */
	public Has(action: ActionEntry) {
		return this.actions.containsKey(action);
	}

	/**
	 * Registers an action into the context.
	 */
	public Bind<R extends RawActionEntry, A extends ActionLike<R>>(
		action: A | ActionLikeArray<R>,
		listener: A extends Manual<infer P> ? ActionListener<P> : ActionListener,
	) {
		const { actions } = this;

		if (t.isAction(action)) {
			this.ConnectAction<R>(action);
			actions.insert(action, listener);
		} else {
			const actionEntry = transformAction<R>(action);

			this.ConnectAction<R>(actionEntry);
			actions.insert(actionEntry, listener);
		}

		return this;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _BindEvent<P extends Array<unknown>>(
		name: string,
		event: SignalWrapper<(...args: P) => void>,
		listener: ActionListener<P>,
		isSync: boolean,
	) {
		const { events } = this;
		const action = new Manual<P>();
		const onEvent = (...args: P) => action.Trigger(...args);

		let connection: SignalConnection;

		if ("Connect" in event) {
			connection = event.Connect(onEvent);
		} else if ("connect" in event) {
			connection = event.connect(onEvent);
		} else {
			error(SIGNAL_NO_CONNECT_METHOD_ERROR);
		}

		const entry = { action: isSync ? new Sync(action) : action, connection };

		events.tryInsert(name, entry)
			.orElse(() => {
				this.UnbindEvent(name);
				return Ok(entry);
			})
			.andWith((e) => {
				this.Bind(e.action, listener);
				return Ok(e);
			});
	}

	/**
	 * Registers an event into the context.
	 */
	public BindEvent<P extends Array<unknown>>(
		name: string,
		event: SignalWrapper<(...args: P) => void>,
		listener: ActionListener<P>,
	) {
		this._BindEvent<P>(name, event, listener, false);

		return this;
	}

	/**
	 * Registers a synchronous event into the context.
	 */
	public BindSyncEvent<P extends Array<unknown>>(
		name: string,
		event: SignalWrapper<(...args: P) => void>,
		listener: ActionListener<P>,
	) {
		this._BindEvent<P>(name, event, listener, true);

		return this;
	}

	/**
	 * Removes an action from the context.
	 */
	public Unbind<R extends RawActionEntry, A extends ActionLike<R>>(action: A) {
		const { actions } = this;

		if (t.isAction(action)) {
			this.RemoveAction(actions.getKeyValue(action).map(([x]) => x));
		} else if (t.isRawAction(action)) {
			this.RemoveAction(
				actions.keys().find(({ RawAction }) => RawAction === (action as never)),
			);
		}

		return this;
	}

	/**
	 * Removes an event connection from the context.
	 */
	public UnbindEvent(name: string) {
		const { events } = this;

		events.removeEntry(name)
			.andWith(([, { action, connection }]) => {
				if ("Disconnect" in connection) {
					connection.Disconnect();
				} else if ("disconnect" in connection) {
					connection.disconnect();
				} else {
					error(SIGNAL_CONNECTION_NO_DISCONNECT_METHOD_ERROR);
				}

				events.remove(name);
				this.Unbind(action);

				return Some({});
			})
			.okOr(rustWarn(EVENT_NOT_BOUND_WARNING(name)));

		return this;
	}

	/**
	 * Removes all bound actions from the context.
	 */
	public UnbindAllActions() {
		const { actions, events } = this;

		actions.keys()
			.filter(
				(action): action is ActionEntry<RawActionEntry> =>
					!events.values().any(({ action: x }) => x === action),
			)
			.forEach((action) => this.Unbind(action));

		return this;
	}

	/**
	 * Removes all bound events from the context.
	 */
	public UnbindAllEvents() {
		const { events } = this;

		events.keys().forEach((name) => this.UnbindEvent(name));

		return this;
	}

	/**
	 * Removes everything that is bound to the context.
	 */
	public UnbindAll() {
		this.UnbindAllActions();
		this.UnbindAllEvents();

		return this;
	}
}
