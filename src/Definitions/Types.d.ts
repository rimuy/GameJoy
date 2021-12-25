import {
	Action,
	Axis,
	Composite,
	Dynamic,
	Middleware,
	Optional,
	Sequence,
	Sync,
	Union,
} from "../Actions";
import aliases from "../Misc/Aliases";

export type ActionEntry<A extends RawActionEntry = RawActionEntry> =
	| Action<A>
	| Axis<AxisActionEntry>
	| Composite<A>
	| Middleware<A>
	| Dynamic<A>
	| Optional<A>
	| Sequence<A>
	| Sync<A>
	| Union<A>;

export type ActionLike<A extends RawActionEntry> = A | ActionEntry<A>;

export type ActionLikeArray<A extends RawActionEntry> = Array<ActionLike<A> | ActionLikeArray<A>>;

export type ActionListener = () => void | Promise<void>;

export type ActionKey = ActionLike<RawActionEntry> | ActionLikeArray<RawActionEntry>;

export type Aliases = typeof aliases;

export type AliasKey = Aliases extends ReadonlyMap<infer K, infer _> ? K : never;

/**
 * Utility type that holds all the available action entry types.
 */
export type AnyAction = ActionEntry | ActionKey;

export type AxisActionLike =
	| Enum.UserInputType.MouseMovement
	| Enum.UserInputType.MouseWheel
	| Enum.UserInputType.Touch
	| Enum.UserInputType.Gyro
	| Enum.UserInputType.Accelerometer
	| Enum.UserInputType.Gamepad1
	| Enum.UserInputType.Gamepad2
	| Enum.UserInputType.Gamepad3
	| Enum.UserInputType.Gamepad4
	| Enum.UserInputType.Gamepad5
	| Enum.UserInputType.Gamepad6
	| Enum.UserInputType.Gamepad7
	| Enum.UserInputType.Gamepad8
	| Enum.KeyCode.Thumbstick1
	| Enum.KeyCode.Thumbstick2
	| Enum.KeyCode.ButtonL1
	| Enum.KeyCode.ButtonR1
	| Enum.KeyCode.ButtonL2
	| Enum.KeyCode.ButtonR2;

type UnusedKeys =
	| Enum.KeyCode.Unknown
	| Enum.KeyCode.World0
	| Enum.KeyCode.World1
	| Enum.KeyCode.World2
	| Enum.KeyCode.World3
	| Enum.KeyCode.World4
	| Enum.KeyCode.World5
	| Enum.KeyCode.World6
	| Enum.KeyCode.World7
	| Enum.KeyCode.World8
	| Enum.KeyCode.World9
	| Enum.KeyCode.World10
	| Enum.KeyCode.World11
	| Enum.KeyCode.World12
	| Enum.KeyCode.World13
	| Enum.KeyCode.World14
	| Enum.KeyCode.World15
	| Enum.KeyCode.World16
	| Enum.KeyCode.World17
	| Enum.KeyCode.World18
	| Enum.KeyCode.World19
	| Enum.KeyCode.World20
	| Enum.KeyCode.World21
	| Enum.KeyCode.World22
	| Enum.KeyCode.World23
	| Enum.KeyCode.World24
	| Enum.KeyCode.World25
	| Enum.KeyCode.World26
	| Enum.KeyCode.World27
	| Enum.KeyCode.World28
	| Enum.KeyCode.World29
	| Enum.KeyCode.World30
	| Enum.KeyCode.World31
	| Enum.KeyCode.World32
	| Enum.KeyCode.World33
	| Enum.KeyCode.World34
	| Enum.KeyCode.World35
	| Enum.KeyCode.World36
	| Enum.KeyCode.World37
	| Enum.KeyCode.World38
	| Enum.KeyCode.World39
	| Enum.KeyCode.World40
	| Enum.KeyCode.World41
	| Enum.KeyCode.World42
	| Enum.KeyCode.World43
	| Enum.KeyCode.World44
	| Enum.KeyCode.World45
	| Enum.KeyCode.World46
	| Enum.KeyCode.World47
	| Enum.KeyCode.World48
	| Enum.KeyCode.World49
	| Enum.KeyCode.World50
	| Enum.KeyCode.World51
	| Enum.KeyCode.World52
	| Enum.KeyCode.World53
	| Enum.KeyCode.World54
	| Enum.KeyCode.World55
	| Enum.KeyCode.World56
	| Enum.KeyCode.World57
	| Enum.KeyCode.World58
	| Enum.KeyCode.World59
	| Enum.KeyCode.World60
	| Enum.KeyCode.World61
	| Enum.KeyCode.World62
	| Enum.KeyCode.World63
	| Enum.KeyCode.World64
	| Enum.KeyCode.World65
	| Enum.KeyCode.World66
	| Enum.KeyCode.World67
	| Enum.KeyCode.World68
	| Enum.KeyCode.World69
	| Enum.KeyCode.World70
	| Enum.KeyCode.World71
	| Enum.KeyCode.World72
	| Enum.KeyCode.World73
	| Enum.KeyCode.World74
	| Enum.KeyCode.World75
	| Enum.KeyCode.World76
	| Enum.KeyCode.World77
	| Enum.KeyCode.World78
	| Enum.KeyCode.World79
	| Enum.KeyCode.World80
	| Enum.KeyCode.World81
	| Enum.KeyCode.World82
	| Enum.KeyCode.World83
	| Enum.KeyCode.World84
	| Enum.KeyCode.World85
	| Enum.KeyCode.World86
	| Enum.KeyCode.World87
	| Enum.KeyCode.World88
	| Enum.KeyCode.World89
	| Enum.KeyCode.World90
	| Enum.KeyCode.World91
	| Enum.KeyCode.World92
	| Enum.KeyCode.World93
	| Enum.KeyCode.World94
	| Enum.KeyCode.World95;

export type AxisActionEntry = CastsToEnum<AxisActionLike>;

export type RawAction = Exclude<Enum.KeyCode | Enum.UserInputType, UnusedKeys>;

export type RawActionEntry = Exclude<CastsToEnum<RawAction>, CastsToEnum<UnusedKeys>> | AliasKey;

/**
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
 */
export interface ContextOptions {
	readonly ActionGhosting?: number;
	readonly OnBefore?: () => boolean;
	readonly Process?: boolean;
	readonly RunSynchronously?: boolean;
}
