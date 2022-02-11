import { RunService } from "@rbxts/services";
import { type Option, HashMap, Vec } from "@rbxts/rust-classes";

import { ActionQueue } from "./ActionQueue";

import { ActionConnection } from "./ActionConnection";

import {
	ActionEntry,
	ActionLike,
	ActionLikeArray,
	ActionListener,
	ContextOptions,
	RawActionEntry,
	GetListener,
} from "../definitions";

import { Sync } from "../Actions";

import { LayoutKind } from "../Misc/KeyboardLayout";

import { transformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

interface Options extends Required<Omit<ContextOptions, "Process">> {
	Process?: boolean;
}

/* eslint-disable prettier/prettier */
const ACTION_UNWRAP_ERROR = "An error occurred while trying to unwrap action.";
const CHOSEN_ACTION_UNWRAP_ERROR = "Error while unwraping the chosen action. Vec may be empty.";
const ACTION_REMOVAL_WARNING = debug.traceback("The specified action is not bound to this context.");
/* eslint-enable prettier/prettier */

const defaultOptions: Options = {
	ActionGhosting: 0,
	KeyboardLayout: LayoutKind.QWERTY,
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
		this.pending = Vec.vec();
		this.isPending = false;
		this.queue = new ActionQueue();
	}

	private _ConnectAction<A extends RawActionEntry>(action: ActionEntry<A>) {
		action.SetContext(this);
		const connection = ActionConnection.From(action);

		connection.Triggered((_, ...args) => {
			if (!action.IsLocked) {
				this._Check<A>(action, ...args);
			}
		});

		connection.Destroyed(() => {
			this.Unbind(action);
		});
	}

	private _Check<A extends RawActionEntry>(action: ActionEntry<A>, ...args: Array<unknown>) {
		const { actions, pending, queue } = this;
		const { RunSynchronously: isSync, OnBefore, ActionGhosting: ghostingCap } = this.Options;
		const listener = () => actions.get(action).expect(ACTION_UNWRAP_ERROR)(...args);
		const result = OnBefore();

		if (Promise.is(result) ? result.await()[0] : result) {
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
												(r) =>
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
						t.isEntryOfType(chosenAction, "SynchronousAction")
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
	}

	private _RemoveAction(actionOpt: Option<ActionEntry>) {
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
		listener: GetListener<A>,
	) {
		const { actions } = this;

		if (t.isAction(action)) {
			this._ConnectAction<R>(action);
			actions.insert(action, listener as never);
		} else {
			const actionEntry = transformAction<R>(action);

			this._ConnectAction<R>(actionEntry);
			actions.insert(actionEntry, listener as never);
		}

		return this;
	}

	/**
	 * Registers a synchronous action into the context.
	 */
	public BindSync<R extends RawActionEntry, A extends ActionLike<R>>(
		action: A | ActionLikeArray<R>,
		listener: GetListener<A>,
	) {
		return this.Bind(new Sync(action), listener as never);
	}

	/**
	 * Removes an action from the context.
	 */
	public Unbind<R extends RawActionEntry, A extends ActionLike<R>>(action: A) {
		const { actions } = this;

		if (t.isAction(action)) {
			this._RemoveAction(actions.getKeyValue(action).map(([x]) => x));
		} else if (t.isRawAction(action)) {
			this._RemoveAction(
				actions.keys().find(({ RawAction }) => RawAction === (action as never)),
			);
		}

		return this;
	}

	/**
	 * Removes all bound actions from the context.
	 */
	public UnbindAll() {
		const { actions } = this;

		actions.keys().forEach((action) => this.Unbind(action));

		return this;
	}
}
