import { UserInputService as IS } from "@rbxts/services";
import Signal from "@rbxts/signal";

import {
	ActionLike,
	ActionLikeArray,
	ContextOptions,
	RawAction,
	RawActionEntry,
} from "../Definitions/Types";

import { Context } from "./Context";

import * as t from "../Util/TypeChecks";
import { TranslateRawAction } from "../Util/TranslateRawAction";
import { IsInputDown } from "../Util/IsInputDown";

export abstract class BaseAction {
	readonly Content: ReadonlyArray<RawAction> = new Array<RawAction>();

	readonly RawAction!: ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>;

	readonly IsActive: boolean = false;

	readonly Resolved = new Signal();

	readonly Rejected = new Signal();

	readonly Triggered = new Signal<(processed?: boolean) => void>();

	readonly Released = new Signal<(processed?: boolean) => void>();

	readonly Began = new Signal<(processed: boolean) => void>();

	readonly Ended = new Signal<(processed: boolean) => void>();

	readonly Cancelled = new Signal();

	readonly Connected = new Signal();

	readonly Changed = new Signal();

	readonly Destroyed = new Signal();

	readonly Context: Context<ContextOptions> | undefined;

	constructor() {
		const content = this.Content as Array<RawAction>;

		const visit = (
			action:
				| RawActionEntry
				| ActionLike<RawActionEntry>
				| ActionLikeArray<RawActionEntry>,
		) => {
			if (t.isAction(action)) {
				visit(action.RawAction);
			} else if (t.isRawAction(action)) {
				content.push(TranslateRawAction(action));
			} else if (t.isActionLikeArray(action)) {
				action.forEach((RawActionEntry) => visit(RawActionEntry));
			}
		};

		this.Destroyed.Connect(() => this.SetContext(undefined));
		this.Connected.Connect(() => {
			this.OnConnected();
			content.clear();
			visit(this.RawAction);
		});
	}

	protected SetTriggered(value: boolean, ignoreEventCall?: boolean) {
		(this.IsActive as boolean) = value;

		if (!ignoreEventCall) {
			this[value === true ? "Triggered" : "Released"].Fire(
				this.Context?.Options?.Process,
			);
		}
	}

	protected OnConnected() {}

	/** @internal */
	SetContext<O extends ContextOptions>(context: Context<O> | undefined) {
		(this.Context as unknown) = context;
		this.Connected.Fire();
	}

	GetActiveInputs() {
		return this.Content.filter((input) => IsInputDown(input));
	}

	GetContentString() {
		return this.Content.map((x) => {
			const code = IS.GetStringForKeyCode(x as Enum.KeyCode);
			return t.isKeyCode(x) && code.size() > 0 ? code : x.Name;
		}) as ReadonlyArray<RawAction["Name"]>;
	}

	Destroy() {
		this.Destroyed.Fire();
	}
}
