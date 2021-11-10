import { Action, Composite, Dynamic, Optional, Ordered, Mixed } from "../Actions";

export type ActionEntry<A extends RawActionEntry = RawActionEntry> =
	| Action<A>
	| Composite<A>
	| Dynamic<A>
	| Optional<A>
	| Ordered<A>
	| Mixed<A>;

export type ActionKey = RawActionEntry | Array<RawActionEntry | ActionEntry>;

export type RawActionLike = Enum.KeyCode | Enum.UserInputType;

export type RawActionEntry = CastsToEnum<RawActionLike>;

export interface ActionEntryConstructor<R extends RawActionEntry> {
	new <A extends R>(entry: A): ActionEntry<A>;
}

export interface ContextOptions {
	readonly OnBefore?: () => boolean;
	readonly Process?: boolean;
	readonly RunSynchronously?: boolean;
}
