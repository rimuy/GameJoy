import { Action, Composite, Dynamic, Optional, Sequence, Union } from "../Actions";

export type ActionEntry<A extends RawActionEntry = RawActionEntry> =
	| Action<A>
	| Composite<A>
	| Dynamic<A>
	| Optional<A>
	| Sequence<A>
	| Union<A>;

export type ActionKey = RawActionEntry | Array<RawActionEntry | ActionEntry>;

export type RawActionLike = Enum.KeyCode | Enum.UserInputType;

export type RawActionEntry = CastsToEnum<RawActionLike>;

export interface ContextOptions {
	readonly OnBefore?: () => boolean;
	readonly Process?: boolean;
	readonly RunSynchronously?: boolean;
}
