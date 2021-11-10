import Signal from "@rbxts/signal";

import { ContextOptions } from "../Definitions/Types";
import { Context } from "./Context";

export abstract class BaseAction {
	readonly IsPressed: boolean = false;

	readonly Resolved = new Signal();

	readonly Rejected = new Signal();

	readonly Triggered = new Signal<(processed?: boolean) => void>();

	readonly Released = new Signal<(processed?: boolean) => void>();

	readonly Cancelled = new Signal();

	readonly Connected = new Signal();

	readonly Changed = new Signal();

	readonly Destroyed = new Signal();

	readonly Context: Context<ContextOptions> | undefined;

	protected SetTriggered(value: boolean, ignoreEventCall?: boolean) {
		(this.IsPressed as boolean) = value;

		!ignoreEventCall && this[value === true ? "Triggered" : "Released"].Fire(this.Context?.Options.Process);
	}

	SetContext<O extends ContextOptions>(context: Context<O> | undefined) {
		(this.Context as unknown) = context;
		this.Connected.Fire();
	}
}
