import { UserInputService as IS } from "@rbxts/services";
import Signal from "@rbxts/signal";

import {
	ActionLike,
	ActionLikeArray,
	ContextOptions,
	RawAction,
	RawActionEntry,
	ConsumerSignal,
	SignalWithParams,
	ActionEntry,
} from "../definitions";

import { Context } from "./Context";

import * as t from "../Util/TypeChecks";
import { extractEnum } from "../Util/ExtractEnum";
import { isInputDown } from "../Util/IsInputDown";

export abstract class BaseAction {
	protected abstract Parameters: Array<unknown>;

	protected readonly Connected: ConsumerSignal;

	protected readonly Changed: ConsumerSignal;

	protected Middleware?: (action: ActionEntry<RawAction>) => boolean | Promise<boolean>;

	protected OnTriggered: () => void;

	/**
	 * Returns a list containing all the keys and input states that are registered in the context,
	 * including nested ones.
	 */
	public readonly Content: ReadonlyArray<RawAction>;

	/** The action entry that was passed into the constructor. */
	public readonly RawAction!: ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>;

	/** Shows whether the action is active. */
	public readonly IsActive;

	/** Shows whether the action is locked. */
	public readonly IsLocked;

	/** Shows whether the action is ready. */
	public readonly IsReady;

	/** Fired when the action is successfully executed. */
	public readonly Resolved: ConsumerSignal;

	/** Fired when the action is aborted before it's processed by the queue. */
	public readonly Rejected: ConsumerSignal;

	/** Fired when the action is triggered. */
	public readonly Triggered: ConsumerSignal<(processed?: boolean, ...params: Array<any>) => void>;

	/** Fired when the action is released. */
	public readonly Released: ConsumerSignal<(processed?: boolean) => void>;

	/** Fired when the action is destroyed. */
	public readonly Destroyed: ConsumerSignal;

	/** The context which the action is bound to. */
	public readonly Context: Context<ContextOptions> | undefined;

	public constructor() {
		this.IsActive = false;
		this.IsLocked = false;
		this.IsReady = false;
		this.Content = [];
		this.OnTriggered = () => {};
		this.Connected = new Signal();
		this.Changed = new Signal();
		this.Resolved = new Signal();
		this.Rejected = new Signal();
		this.Triggered = new Signal();
		this.Released = new Signal();
		this.Destroyed = new Signal();

		this.Destroyed.Connect(() => this.SetContext(undefined));
		this.Connected.Connect(() => {
			this.OnConnected();
			this.LoadContent();

			(this.IsReady as boolean) = true;
		});
	}

	private _VisitEachRawAction(
		action: RawActionEntry | ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>,
	) {
		if (t.isAction(action)) {
			this._VisitEachRawAction(action.RawAction);
		} else if (t.isRawAction(action)) {
			(this.Content as Array<RawAction>).push(extractEnum(action));
		} else if (t.isActionLikeArray(action)) {
			action.forEach((entry) => this._VisitEachRawAction(entry));
		}
	}

	protected LoadContent() {
		const content = this.Content as Array<RawAction>;
		content.clear();

		this._VisitEachRawAction(this.RawAction);
	}

	protected SetTriggered(value: boolean, ignoreEventCall?: boolean, ...args: Array<unknown>) {
		(this.IsActive as boolean) = value;

		if (!ignoreEventCall) {
			(this[value === true ? "Triggered" : "Released"] as SignalWithParams).Fire(
				this.Context?.Options?.Process,
				...args,
			);
		}
	}

	protected abstract OnConnected(): void;

	protected abstract _GetLastParameters(): LuaTuple<Array<unknown>>;

	/** Returns a new instance of an action. */
	public abstract Clone(): BaseAction;

	/** @internal */
	public SetContext<O extends ContextOptions>(context: Context<O> | undefined) {
		const wasBound = this.IsBound();
		(this.Context as unknown) = context;

		if (!wasBound) {
			(this.Connected as Signal).Fire();
		}
	}

	/** Prevents the action from being checked by the context when triggered. */
	public Lock() {
		(this.IsLocked as boolean) = true;
	}

	/** Unlocks the action. */
	public Unlock() {
		(this.IsLocked as boolean) = false;
	}

	/** Checks if the action belongs to a context. */
	public IsBound() {
		return this.Context !== undefined;
	}

	/** Returns a list of the action's current active inputs. */
	public GetActiveInputs() {
		return this.Content.filter((input) =>
			isInputDown(input, this.Context?.Options.KeyboardLayout),
		) as ReadonlyArray<RawAction>;
	}

	/** Returns a string list containing all the input names from the action. */
	public GetContentString() {
		return this.Content.map((x) => {
			const code = IS.GetStringForKeyCode(x as Enum.KeyCode);
			return t.isKeyCode(x) && code.size() > 0 ? code : x.Name;
		}) as ReadonlyArray<RawAction["Name"]>;
	}

	/** Destroys the action and clean up its connections. */
	public Destroy() {
		(this.Destroyed as Signal).Fire();
	}
}
