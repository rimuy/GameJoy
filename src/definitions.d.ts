import Signal from "@rbxts/signal";

import {
	Action,
	Axis,
	Composite,
	Dynamic,
	Manual,
	Optional,
	Sequence,
	Sync,
	Union,
	Unique,
} from "./Actions";

import aliases from "./Misc/Aliases";

import { axisActionEntries, GamepadKind, unusedKeys } from "./Misc/Entries";

import { LayoutKind } from "./Misc/KeyboardLayout";

export type ActionEntry<A extends RawActionEntry = RawActionEntry> =
	| Action<A>
	| Axis<AxisActionEntry, any>
	| Composite<A>
	| Manual<Array<any>>
	| Dynamic<A>
	| Optional<A>
	| Sequence<A>
	| Sync<A>
	| Union<A>
	| Unique<A>;

export type ActionLike<A extends RawActionEntry> = A | ActionEntry<A>;

export type ActionLikeArray<A extends RawActionEntry> = Array<ActionLike<A> | ActionLikeArray<A>>;

export type ActionListener<P extends Array<unknown> = []> = (...params: P) => unknown | Promise<unknown>;

export type ActionKey<A extends RawActionEntry> = ActionLike<A> | ActionLikeArray<A>;

export type Aliases = typeof aliases;

export type AliasKey = Aliases extends ReadonlyMap<infer K, infer _> ? K : never;

/**
 * Utility type that holds all the available action entry types for `DynamicAction`.
 */
export type AnyAction = AxisActionEntry | RawActionEntry;

export type AxisActionLike = typeof axisActionEntries[number];

type UnusedKeys = typeof unusedKeys[number];

export type AxisActionEntry = CastsToEnum<AxisActionLike>;

export type RawAction = Exclude<Enum.KeyCode | Enum.UserInputType, UnusedKeys>;

export type RawActionEntry = Exclude<CastsToEnum<RawAction>, CastsToEnum<UnusedKeys>> | AliasKey;

export type ConsumerSignal<T extends Callback = () => void> = Omit<Signal<T>, "Fire" | "Destroy">;

export type SignalWithParams = Signal<(...params: Array<any>) => void>;

export type TransformAction<
	R extends RawActionEntry,
	A extends ActionKey<R>,
> = A extends ActionLikeArray<R> ? Union<R> : A extends string ? Action<R> : A;

export type AvailableAxisTypes = number | Vector2 | CFrame | undefined;

export type Axis1d = {
	/** @hidden @deprecated */
	readonly _nominal_axis1d: unique symbol;
};

export type Axis2d = {
	/** @hidden @deprecated */
	readonly _nominal_axis2d: unique symbol;
};

export type Gyroscope = {
	/** @hidden @deprecated */
	readonly _nominal_gyro: unique symbol;
};

export type MemberType<T> = T extends Axis1d
	? number
	: T extends Axis2d
	? Vector2
	: T extends Gyroscope
	? undefined
	: never;

export type GetListener<A> = A extends Axis<AxisActionEntry, infer T>
	? T extends Axis1d | Axis2d
		? ActionListener<[position: MemberType<T>, delta: MemberType<T>, gamepad: GamepadKind]>
		: T extends Gyroscope
		? ActionListener<[deviceRotation: CFrame | undefined, gamepad: GamepadKind]>
		: ActionListener<[gamepad: GamepadKind]>
	: A extends Manual<infer P>
	? ActionListener<P>
	: ActionListener;

export type GetParameters<A> = Parameters<GetListener<A>>;

export interface ActionOptions {
	Repeat?: number;
	Timing?: number;
}

export interface ContextOptions {
	readonly ActionGhosting?: number;
	readonly KeyboardLayout?: LayoutKind;
	readonly OnBefore?: () => boolean | Promise<boolean>;
	readonly Process?: boolean;
	readonly RunSynchronously?: boolean;
}

interface CamelCaseSignal<T extends (...args: Array<unknown>) => void> {
	connect(this: SignalWrapper<T>, callback: T): SignalConnection;
}

interface PascalCaseSignal<T extends (...args: Array<unknown>) => void> {
	Connect(this: SignalWrapper<T>, callback: T): SignalConnection;
}

interface CamelCaseSignalConnection {
	disconnect(this: SignalConnection): void;
}

interface PascalCaseSignalConnection {
	Disconnect(this: SignalConnection): void;
}

export type SignalWrapper<T extends Callback = () => void> = CamelCaseSignal<T> | PascalCaseSignal<T>;

export type SignalConnection = CamelCaseSignalConnection | PascalCaseSignalConnection;
