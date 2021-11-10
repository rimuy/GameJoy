import { Bin } from "@rbxts/bin";
import { RunService } from "@rbxts/services";
import { Result, HashMap, Option } from "@rbxts/rust-classes";

import { ActionEntry, ActionKey, ContextOptions, RawActionEntry } from "../Definitions/Types";
import { Action } from "../Actions/Action";
import { MixedAction } from "../Actions/MixedAction";
import { ActionConnection } from "../Util/ActionConnection";
import { ActionQueue } from "./ActionQueue";

import * as t from "../Util/TypeChecks";

const { ok: Ok, err: Err } = Result;

const RAW_ACTION_REMOVAL_ERROR = "An error ocurred while trying to remove a raw action.";

const defaultOptions: ContextOptions = {
	OnBefore: () => true,
	RunSynchronously: false,
};

export class Context<O extends ContextOptions> {
	private bin;

	private queue;

	private actions: HashMap<ActionEntry, () => void | Promise<void>>;

	private rawActions: HashMap<ActionKey, ActionEntry>;

	constructor(public readonly Options: O) {
		if (!RunService.IsClient()) {
			error(
				debug.traceback(
					`${getmetatable(this)} can only be instantied on the client.`,
				),
			);
		}

		this.bin = new Bin();
		this.actions = HashMap.empty();
		this.rawActions = HashMap.empty();
		this.queue = new ActionQueue();
	}

	private ConnectAction<A extends RawActionEntry>(action: ActionEntry<A>) {
		const {
			Options: { RunSynchronously, OnBefore },
		} = this;

		action.SetContext(this);

		ActionConnection.From(action).Triggered(() => {
			const listener = this.actions
				.get(action)
				.expect("An error occurred while trying to unwrap action.");

			if (OnBefore!() === true) {
				if (RunSynchronously === true) listener();
				else this.queue.Add(action, listener);
			}
		});
	}

	private RemoveAction(action: ActionEntry) {
		action.Destroyed.Fire();
		this.actions.remove(action);
	}

	private TryRemoveAction(actionOpt: Option<ActionEntry>) {
		if (actionOpt.isSome()) {
			this.RemoveAction(actionOpt.unwrap());
			return Ok({});
		}

		return Err(RAW_ACTION_REMOVAL_ERROR);
	}

	Has(action: ActionEntry) {
		return this.actions.containsKey(action);
	}

	/**
	 * @client
	 */
	Bind<R extends RawActionEntry, A extends ActionEntry<R>>(
		action: A | R | Array<A | R>,
		listener: () => void | Promise<void>,
	) {
		const { actions } = this;

		if (t.isAction(action)) {
			this.ConnectAction<R>(action);

			actions.insert(action, listener);
		} else {
			this.rawActions.entry(action).orInsertWith(() => {
				const actionEntry = t.isActionLikeArray(action)
					? new MixedAction<R>(action)
					: new Action<R>(action);

				this.ConnectAction<R>(actionEntry);

				actions.insert(actionEntry, listener);
				return actionEntry;
			});
		}

		return this;
	}

	/**
	 * @client
	 */
	Unbind<R extends RawActionEntry, A extends ActionEntry<R>>(action: A | R | Array<A | R>) {
		const { rawActions } = this;

		if (t.isAction(action)) {
			this.RemoveAction(action);
		} else {
			const removed = rawActions.remove(action);

			if (t.isActionLikeArray(action)) {
				this.TryRemoveAction(removed);
			} else {
				this.TryRemoveAction(removed).or(
					this.TryRemoveAction(
						this.actions
							.keys()
							.find(({ RawAction }) => RawAction === action),
					),
				);
			}
		}

		return this;
	}

	UnbindAll() {
		this.actions.iter().forEach(([action]) => action.Destroyed.Fire());

		this.actions.clear();
		this.rawActions.clear();
		this.bin.destroy();

		return this;
	}
}
