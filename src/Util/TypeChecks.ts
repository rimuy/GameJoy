import { t } from "@rbxts/t";

import aliases from "../Misc/Aliases";
import {
	axisActionEntries,
	mouseButtonEntries,
	numberAxisTypes,
	vector2AxisTypes,
	unusedKeys,
} from "../Misc/Entries";

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
} from "../Actions";

import { ActionEntry, AxisActionEntry, AliasKey, RawActionEntry, RawAction } from "../definitions";

interface ActionTypes<A extends RawActionEntry> {
	Action: Action<A>;
	AxisAction: Axis<AxisActionEntry>;
	CompositeAction: Composite<A>;
	DynamicAction: Dynamic<A>;
	ManualAction: Manual;
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
	"OptionalAction",
	"SequenceAction",
	"SynchronousAction",
	"UnionAction",
	"UniqueAction",
] as const;

const classIsOfType = (value: unknown, classType: string) =>
	type(value) === "table" && tostring(getmetatable(value as object)) === classType;

/**
 * Checks if the action entry matches a KeyCode and/or UserInputType member.
 */
export const isActionEqualTo = (entry: unknown, key?: Enum.KeyCode, input?: Enum.UserInputType) =>
	(isActionLike(entry) || isAxisActionEntry(entry)) &&
	((typeIs(entry, "EnumItem") && key === entry) ||
		(typeIs(entry, "string") && key?.Name === entry) ||
		(typeIs(entry, "number") && key?.Value === entry) ||
		(typeIs(entry, "EnumItem") && input === entry) ||
		(typeIs(entry, "string") && input?.Name === entry) ||
		(typeIs(entry, "number") && input?.Value === entry));

/**
 * Checks if the value is an action object.
 */
export const isAction = <A extends RawActionEntry>(value: unknown): value is ActionEntry<A> =>
	actions.some((actionType) => classIsOfType(value, actionType));

/**
 * Checks if the value is an array of action objects.
 */
export const isActionArray = t.array(isAction);

const EnumAlias =
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
export const isEntryOfType = <A extends RawActionEntry, E extends keyof ActionTypes<A>>(
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
export const isMouseButton = (value: unknown): value is typeof mouseButtonEntries[number] =>
	mouseButtonEntries.some(
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
	isEntryOfType(value, "Action") || isEntryOfType(value, "SequenceAction");

export const isAxis1d = (value: unknown): value is typeof numberAxisTypes[number] =>
	numberAxisTypes.includes(value as never);

export const isAxis2d = (value: unknown): value is typeof vector2AxisTypes[number] =>
	vector2AxisTypes.includes(value as never);

export const isAxisGyro = (value: unknown): value is CastsToEnum<Enum.UserInputType.Gyro> =>
	isActionEqualTo(value, undefined, Enum.UserInputType.Gyro);
