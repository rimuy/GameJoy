import { t } from "@rbxts/t";

import aliases from "../Misc/Aliases";

import {
	Action,
	Axis,
	Composite,
	Dynamic,
	Manual,
	Middleware,
	Optional,
	Sequence,
	Sync,
	Union,
	Unique,
} from "../Actions";

import { ActionEntry, AxisActionEntry, AliasKey, RawActionEntry, RawAction } from "../Definitions/Types";

interface ActionTypes<A extends RawActionEntry> {
	Action: Action<A>;
	AxisAction: Axis<AxisActionEntry>;
	CompositeAction: Composite<A>;
	DynamicAction: Dynamic<A>;
	ManualAction: Manual;
	MiddlewareAction: Middleware<A>;
	OptionalAction: Optional<A>;
	SequenceAction: Sequence<A>;
	SynchronousAction: Sync<A>;
	UnionAction: Union<A>;
	UniqueAction: Unique<A>;
}

type CancellableAction<A extends RawActionEntry> = Action<A> | Sequence<A>;

const actions = [
	"Action",
	"AxisAction",
	"CompositeAction",
	"DynamicAction",
	"ManualAction",
	"MiddlewareAction",
	"OptionalAction",
	"SequenceAction",
	"SynchronousAction",
	"UnionAction",
	"UniqueAction",
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

const unusedKeys = [
	Enum.KeyCode.Unknown,
	Enum.KeyCode.World0,
	Enum.KeyCode.World1,
	Enum.KeyCode.World2,
	Enum.KeyCode.World3,
	Enum.KeyCode.World4,
	Enum.KeyCode.World5,
	Enum.KeyCode.World6,
	Enum.KeyCode.World7,
	Enum.KeyCode.World8,
	Enum.KeyCode.World9,
	Enum.KeyCode.World10,
	Enum.KeyCode.World11,
	Enum.KeyCode.World12,
	Enum.KeyCode.World13,
	Enum.KeyCode.World14,
	Enum.KeyCode.World15,
	Enum.KeyCode.World16,
	Enum.KeyCode.World17,
	Enum.KeyCode.World18,
	Enum.KeyCode.World19,
	Enum.KeyCode.World20,
	Enum.KeyCode.World21,
	Enum.KeyCode.World22,
	Enum.KeyCode.World23,
	Enum.KeyCode.World24,
	Enum.KeyCode.World25,
	Enum.KeyCode.World26,
	Enum.KeyCode.World27,
	Enum.KeyCode.World28,
	Enum.KeyCode.World29,
	Enum.KeyCode.World30,
	Enum.KeyCode.World31,
	Enum.KeyCode.World32,
	Enum.KeyCode.World33,
	Enum.KeyCode.World34,
	Enum.KeyCode.World35,
	Enum.KeyCode.World36,
	Enum.KeyCode.World37,
	Enum.KeyCode.World38,
	Enum.KeyCode.World39,
	Enum.KeyCode.World40,
	Enum.KeyCode.World41,
	Enum.KeyCode.World42,
	Enum.KeyCode.World43,
	Enum.KeyCode.World44,
	Enum.KeyCode.World45,
	Enum.KeyCode.World46,
	Enum.KeyCode.World47,
	Enum.KeyCode.World48,
	Enum.KeyCode.World49,
	Enum.KeyCode.World50,
	Enum.KeyCode.World51,
	Enum.KeyCode.World52,
	Enum.KeyCode.World53,
	Enum.KeyCode.World54,
	Enum.KeyCode.World55,
	Enum.KeyCode.World56,
	Enum.KeyCode.World57,
	Enum.KeyCode.World58,
	Enum.KeyCode.World59,
	Enum.KeyCode.World60,
	Enum.KeyCode.World61,
	Enum.KeyCode.World62,
	Enum.KeyCode.World63,
	Enum.KeyCode.World64,
	Enum.KeyCode.World65,
	Enum.KeyCode.World66,
	Enum.KeyCode.World67,
	Enum.KeyCode.World68,
	Enum.KeyCode.World69,
	Enum.KeyCode.World70,
	Enum.KeyCode.World71,
	Enum.KeyCode.World72,
	Enum.KeyCode.World73,
	Enum.KeyCode.World74,
	Enum.KeyCode.World75,
	Enum.KeyCode.World76,
	Enum.KeyCode.World77,
	Enum.KeyCode.World78,
	Enum.KeyCode.World79,
	Enum.KeyCode.World80,
	Enum.KeyCode.World81,
	Enum.KeyCode.World82,
	Enum.KeyCode.World83,
	Enum.KeyCode.World84,
	Enum.KeyCode.World85,
	Enum.KeyCode.World86,
	Enum.KeyCode.World87,
	Enum.KeyCode.World88,
	Enum.KeyCode.World89,
	Enum.KeyCode.World90,
	Enum.KeyCode.World91,
	Enum.KeyCode.World92,
	Enum.KeyCode.World93,
	Enum.KeyCode.World94,
	Enum.KeyCode.World95,
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
export const isMouseButton = (value: unknown): value is typeof mouseButtonActionEntries[number] =>
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
	Enum.KeyCode.GetEnumItems()
		.filter((e) => !unusedKeys.some((x) => x === e))
		.some((e) => value === e);

export const isCancellableAction = <A extends RawActionEntry>(
	value: unknown,
): value is CancellableAction<A> =>
	actionEntryIs(value, "Action") || actionEntryIs(value, "SequenceAction");
