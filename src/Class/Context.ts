import { RunService } from "@rbxts/services";
import { Result, HashMap, Option } from "@rbxts/rust-classes";

import { ActionQueue } from "./ActionQueue";

import {
	ActionEntry,
	ActionLike,
	ActionLikeArray,
	ActionListener,
	ActionKey,
	ContextOptions,
	RawActionEntry,
} from "../Definitions/Types";

import { Action, Union } from "../Actions";

import { ActionConnection } from "./ActionConnection";
import { TransformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

const { ok: Ok, err: Err } = Result;

const RAW_ACTION_REMOVAL_ERROR = "An error ocurred while trying to remove a raw action.";

const defaultOptions: Required<Omit<ContextOptions, "Process">> = {
	ActionGhosting: 0,
	OnBefore: () => true,
	RunSynchronously: false,
};

export class Context<O extends ContextOptions> {
	private queue;

	private actions: HashMap<ActionEntry, ActionListener>;

	private rawActions: HashMap<ActionKey, ActionEntry>;

	constructor(public readonly Options?: O) {
		if (!RunService.IsClient()) {
			error(
				debug.traceback(
					`${getmetatable(this)} can only be instantied on the client.`,
				),
			);
		}

		if (!Options) {
			this.Options = defaultOptions as O;
		}

		this.actions = HashMap.empty();
		this.rawActions = HashMap.empty();
		this.queue = new ActionQueue();
	}

	private ConnectAction<A extends RawActionEntry>(action: ActionEntry<A>) {
		const options = { ...defaultOptions, ...this.Options };
		const { RunSynchronously, OnBefore, ActionGhosting } = options;

		action.SetContext(this);
		const connection = ActionConnection.From(action);

		connection.Triggered(() => {
			const listener = this.actions
				.get(action)
				.expect("An error occurred while trying to unwrap action.");

			if (OnBefore() === true) {
				if (
					RunSynchronously === true ||
					t.actionEntryIs(action, "SynchronousAction")
				) {
					listener();
				} else {
					this.queue.Add(action, ActionGhosting, listener);
				}
			}
		});

		connection.Destroyed(() => {
			this.Unbind(action);
		});
	}

	private RemoveAction(action: ActionEntry) {
		this.actions.remove(action);
	}

	private TryRemoveAction(actionOpt: Option<ActionEntry>) {
		if (actionOpt.isSome()) {
			const action = actionOpt.unwrap();
			this.RemoveAction(action);

			action.Destroy();

			return Ok({});
		}

		return Err(RAW_ACTION_REMOVAL_ERROR);
	}

	Has(action: ActionEntry) {
		return this.actions.containsKey(action);
	}

	Bind<R extends RawActionEntry, A extends ActionLike<R>>(
		action: A | ActionLikeArray<R>,
		listener: () => void | Promise<void>,
	) {
		const { actions } = this;

		if (t.isAction(action)) {
			this.ConnectAction<R>(action);

			actions.insert(action, listener);
		} else {
			this.rawActions.entry(action).orInsertWith(() => {
				const actionEntry = TransformAction<R>(action, Action, Union);

				this.ConnectAction<R>(actionEntry);

				actions.insert(actionEntry, listener);
				return actionEntry;
			});
		}

		return this;
	}

	Unbind<R extends RawActionEntry, A extends ActionLike<R>>(action: A | ActionLikeArray<R>) {
		const { rawActions } = this;

		if (t.isAction(action)) {
			this.RemoveAction(action);
		}

		if (t.isRawAction(action) || t.isActionLikeArray(action)) {
			const removed = rawActions.remove(action);

			if (t.isActionLikeArray(action)) {
				this.TryRemoveAction(removed);
			} else {
				this.TryRemoveAction(removed).or(
					this.TryRemoveAction(
						this.actions
							.keys()
							.find(
								({ RawAction }) =>
									RawAction === (action as never),
							),
					),
				);
			}
		}

		return this;
	}

	UnbindAll() {
		this.actions.iter().forEach(([action]) => action.Destroy());
		this.rawActions.values().forEach((action) => action.Destroy());

		this.actions.clear();
		this.rawActions.clear();

		return this;
	}
}
