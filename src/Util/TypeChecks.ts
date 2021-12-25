import { t } from "@rbxts/t";

import aliases from "../Misc/Aliases";

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

import { ActionEntry, AxisActionEntry, AliasKey, RawActionEntry, RawAction } from "../Definitions/Types";

interface ActionTypes<A extends RawActionEntry> {
	Action: Action<A>;
	AxisAction: Axis<AxisActionEntry>;
	CompositeAction: Composite<A>;
	DynamicAction: Dynamic<A>;
	MiddlewareAction: Middleware<A>;
	OptionalAction: Optional<A>;
	SequenceAction: Sequence<A>;
	SynchronousAction: Sync<A>;
	UnionAction: Union<A>;
}

const actions = [
	"Action",
	"AxisAction",
	"CompositeAction",
	"DynamicAction",
	"MiddlewareAction",
	"OptionalAction",
	"SequenceAction",
	"SynchronousAction",
	"UnionAction",
] as const;

const axisActionEntries = [
	Enum.UserInputType.MouseMovement,
	Enum.UserInputType.MouseWheel,
	Enum.UserInputType.Touch,
	Enum.UserInputType.Gyro,
	Enum.UserInputType.Accelerometer,
	Enum.UserInputType.Gamepad1,
	Enum.UserInputType.Gamepad2,
	Enum.UserInputType.Gamepad3,
	Enum.UserInputType.Gamepad4,
	Enum.UserInputType.Gamepad5,
	Enum.UserInputType.Gamepad6,
	Enum.UserInputType.Gamepad7,
	Enum.UserInputType.Gamepad8,
	Enum.KeyCode.Thumbstick1,
	Enum.KeyCode.Thumbstick2,
	Enum.KeyCode.ButtonL1,
	Enum.KeyCode.ButtonR1,
	Enum.KeyCode.ButtonL2,
	Enum.KeyCode.ButtonR2,
] as const;

const mouseButtonActionEntries = [
	Enum.UserInputType.MouseButton1,
	Enum.UserInputType.MouseButton2,
	Enum.UserInputType.MouseButton3,
] as const;

const classIsOfType = (value: unknown, classType: string) =>
	type(value) === "table" && tostring(getmetatable(value as object)) === classType;

/**
 * Checks if the action entry matches a KeyCode and/or UserInputType member.
 */
export const isActionEqualTo = (
	entry: AxisActionEntry | RawActionEntry | ActionEntry,
	key: Enum.KeyCode,
	input?: Enum.UserInputType,
) =>
	(typeIs(entry, "EnumItem") && key === entry) ||
	(typeIs(entry, "string") && key.Name === entry) ||
	(typeIs(entry, "number") && key.Value === entry) ||
	(typeIs(entry, "EnumItem") && input === entry) ||
	(typeIs(entry, "string") && input?.Name === entry) ||
	(typeIs(entry, "number") && input?.Value === entry);

/**
 * Checks if the value is an action object.
 */
export const isAction = <A extends RawActionEntry>(value: unknown): value is ActionEntry<A> =>
	actions.some((actionType) => classIsOfType(value, actionType));

/**
 * Checks if the value is an array of action objects.
 */
export const isActionArray = t.array(isAction);

export const EnumAlias =
	<T extends Enum>(rEnum: T) =>
	(value: unknown): value is RawAction["Name"] | RawAction["Value"] | AliasKey =>
		rEnum
			.GetEnumItems()
			.some(
				(item) =>
					item.Name === value ||
					item.Value === value ||
					aliases.get(value as AliasKey) === item.Name,
			);

/**
 * Checks if the value is a raw action.
 */
export const isRawAction = t.union(
	EnumAlias(Enum.KeyCode),
	EnumAlias(Enum.UserInputType),
	t.enum(Enum.KeyCode),
	t.enum(Enum.UserInputType),
);

/**
 * Checks if the value is an array of raw actions.
 */
export const isRawActionArray = t.array(isRawAction);

/**
 * Checks if the value is action-like.
 */
export const isActionLike = t.union(isAction, isRawAction, isRawActionArray);

/**
 * Checks if the value is an array of action-like values.
 */
export const isActionLikeArray = t.array(isActionLike);

/**
 * Checks if the value is a valid action entry.
 */
export const isValidActionEntry = t.union(isActionLike, isActionLikeArray);

/**
 * Checks if an action object matches a specified variant.
 */
export const actionEntryIs = <A extends RawActionEntry, E extends keyof ActionTypes<A>>(
	value: unknown,
	actionType: E,
): value is ActionTypes<A>[E] => classIsOfType(value, actionType);

/**
 * Checks if the value is an axis action entry.
 */
export const isAxisActionEntry = (value: unknown): value is AxisActionEntry =>
	axisActionEntries.some(
		(e) =>
			(typeIs(value, "EnumItem") && e === value) ||
			(typeIs(value, "string") && e.Name === value) ||
			(typeIs(value, "number") && e.Value === value),
	);

/**
 * Checks if the value is a valid MouseButton entry.
 */
export const isMouseButtonAction = (
	value: RawActionEntry,
): value is typeof mouseButtonActionEntries[number] =>
	mouseButtonActionEntries.some(
		(e) =>
			(typeIs(value, "EnumItem") && e === value) ||
			(typeIs(value, "string") && e.Name === value) ||
			(typeIs(value, "number") && e.Value === value),
	);

/**
 * Checks if the value is a valid KeyCode entry.
 */
export const isKeyCode = (value: unknown): value is Enum.KeyCode =>
	Enum.KeyCode.GetEnumItems().some((e) => value === e);
