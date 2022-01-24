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
} from "../Definitions/Types";

import { Context } from "./Context";

import * as t from "../Util/TypeChecks";
import { TranslateRawAction } from "../Util/TranslateRawAction";
import { IsInputDown } from "../Util/IsInputDown";

export abstract class BaseAction {
	protected readonly Connected: ConsumerSignal;

	protected readonly Changed: ConsumerSignal;

	public readonly Content: ReadonlyArray<RawAction>;

	public readonly RawAction!: ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>;

	public readonly IsActive;

	public readonly Resolved: ConsumerSignal;

	public readonly Rejected: ConsumerSignal;

	public readonly Triggered: ConsumerSignal<(processed?: boolean, ...params: Array<any>) => void>;

	public readonly Released: ConsumerSignal<(processed?: boolean) => void>;

	public readonly Destroyed: ConsumerSignal;

	public readonly Context: Context<ContextOptions> | undefined;

	public constructor() {
		this.IsActive = false;
		this.Content = [];
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
		});
	}

	private VisitEachRawAction(
		action: RawActionEntry | ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>,
	) {
		if (t.isAction(action)) {
			this.VisitEachRawAction(action.RawAction);
		} else if (t.isRawAction(action)) {
			(this.Content as Array<RawAction>).push(TranslateRawAction(action));
		} else if (t.isActionLikeArray(action)) {
			action.forEach((entry) => this.VisitEachRawAction(entry));
		}
	}

	protected LoadContent() {
		const content = this.Content as Array<RawAction>;
		content.clear();

		this.VisitEachRawAction(this.RawAction);
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

	/** @internal */
	public SetContext<O extends ContextOptions>(context: Context<O> | undefined) {
		(this.Context as unknown) = context;
		(this.Connected as Signal).Fire();
	}

	/**
	 * Returns a list of the action's current active inputs.
	 */
	public GetActiveInputs() {
		return this.Content.filter((input) => IsInputDown(input));
	}

	/**
	 * Returns a string list containing all the input names from the action.
	 */
	public GetContentString() {
		return this.Content.map((x) => {
			const code = IS.GetStringForKeyCode(x as Enum.KeyCode);
			return t.isKeyCode(x) && code.size() > 0 ? code : x.Name;
		}) as ReadonlyArray<RawAction["Name"]>;
	}

	/**
	 * Destroys the action and clean up its connections.
	 */
	public Destroy() {
		(this.Destroyed as Signal).Fire();
	}
}
