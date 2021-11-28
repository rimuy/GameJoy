import { t } from "@rbxts/t";

import aliases from "./aliases";
import { Action, Axis, Composite, Dynamic, Optional, Sequence, Union } from "../Actions";
import {
	ActionEntry,
	AxisActionEntry,
	AliasKey,
	RawActionEntry,
	RawActionLike,
} from "../Definitions/Types";

interface ActionTypes<A extends RawActionEntry> {
	Action: Action<A>;
	AxisAction: Axis<AxisActionEntry>;
	CompositeAction: Composite<A>;
	DynamicAction: Dynamic<A>;
	OptionalAction: Optional<A>;
	SequenceAction: Sequence<A>;
	UnionAction: Union<A>;
}

const actions = [
	"Action",
	"AxisAction",
	"CompositeAction",
	"DynamicAction",
	"OptionalAction",
	"SequenceAction",
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

const classIsOfType = (value: unknown, classType: string) =>
	type(value) === "table" && tostring(getmetatable(value as object)) === classType;

export const isActionEqualTo = (
	entry: AxisActionEntry | RawActionEntry | ActionEntry,
	key: Enum.KeyCode,
	input: Enum.UserInputType,
) =>
	(typeIs(entry, "EnumItem") && key === entry) ||
	(typeIs(entry, "string") && key.Name === entry) ||
	(typeIs(entry, "number") && key.Value === entry) ||
	(typeIs(entry, "EnumItem") && input === entry) ||
	(typeIs(entry, "string") && input.Name === entry) ||
	(typeIs(entry, "number") && input.Value === entry);

export const isAction = <A extends RawActionEntry>(value: unknown): value is ActionEntry<A> =>
	actions.some((actionType) => classIsOfType(value, actionType));

export const isActionArray = t.array(isAction);

export const EnumAlias =
	<T extends Enum>(rEnum: T) =>
	(value: unknown): value is RawActionLike["Name"] | RawActionLike["Value"] | AliasKey =>
		rEnum
			.GetEnumItems()
			.some(
				(item) =>
					item.Name === value ||
					item.Value === value ||
					aliases.get(value as AliasKey) === item.Name,
			);

export const isRawAction = t.union(
	EnumAlias(Enum.KeyCode),
	EnumAlias(Enum.UserInputType),
	t.enum(Enum.KeyCode),
	t.enum(Enum.UserInputType),
);

export const isRawActionArray = t.array(isRawAction);

export const isActionLike = t.union(isAction, isRawAction, isRawActionArray);

export const isActionLikeArray = t.array(isActionLike);

export const isValidActionEntry = t.union(isActionLike, isActionLikeArray);

export const actionEntryIs = <A extends RawActionEntry, E extends keyof ActionTypes<A>>(
	value: unknown,
	actionType: E,
): value is ActionTypes<A>[E] => classIsOfType(value, actionType);

export const isAxisActionEntry = (value: unknown): value is AxisActionEntry =>
	axisActionEntries.some(
		(e) =>
			(typeIs(value, "EnumItem") && e === value) ||
			(typeIs(value, "string") && e.Name === value) ||
			(typeIs(value, "number") && e.Value === value),
	);
