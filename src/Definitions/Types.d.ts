import { Action, Axis, Composite, Dynamic, Optional, Sequence, Union } from "../Actions";

export type ActionEntry<A extends RawActionEntry = RawActionEntry> =
	| Action<A>
	| Axis<AxisActionEntry>
	| Composite<A>
	| Dynamic<A>
	| Optional<A>
	| Sequence<A>
	| Union<A>;

export type ActionKey = RawActionEntry | Array<RawActionEntry | ActionEntry>;

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

export type AxisActionEntry = CastsToEnum<AxisActionLike>;

export type RawActionLike = Enum.KeyCode | Enum.UserInputType;

export type RawActionEntry = CastsToEnum<RawActionLike>;

export interface ContextOptions {
	readonly OnBefore?: () => boolean;
	readonly Process?: boolean;
	readonly RunSynchronously?: boolean;
}
