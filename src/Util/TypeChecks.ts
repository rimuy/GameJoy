import { t } from "@rbxts/t";

import { Action, Composite, Dynamic, Optional, Ordered, Mixed } from "../Actions";
import { ActionEntry, RawActionEntry, RawActionLike } from "../Definitions/Types";

interface ActionTypes<A extends RawActionEntry> {
	Action: Action<A>;
	CompositeAction: Composite<A>;
	DynamicAction: Dynamic<A>;
	MixedAction: Mixed<A>;
	OptionalAction: Optional<A>;
	OrderedAction: Ordered<A>;
}

export const isActionEqualTo = (
	entry: RawActionEntry | ActionEntry,
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
	[
		"Action",
		"CompositeAction",
		"DynamicAction",
		"MixedAction",
		"OptionalAction",
		"OrderedAction",
	].some(
		(actionType) =>
			type(value) === "table" &&
			tostring(getmetatable(value as object)) === actionType,
	);

export const isActionArray = t.array(isAction);

export const EnumAlias =
	<T extends Enum>(rEnum: T) =>
	(value: unknown): value is RawActionLike["Name"] | RawActionLike["Value"] =>
		rEnum.GetEnumItems().some((item) => item.Name === value || item.Value === value);

export const isRawAction = t.union(
	EnumAlias(Enum.KeyCode),
	EnumAlias(Enum.UserInputType),
	t.enum(Enum.KeyCode),
	t.enum(Enum.UserInputType),
);

export const isRawActionArray = t.array(isRawAction);

export const isActionLike = t.union(isAction, isRawAction);

export const isActionLikeArray = t.array(isActionLike);

export const isValidActionEntry = t.union(isActionLike, isActionLikeArray);

export const ActionEntryIs = <A extends RawActionEntry, E extends keyof ActionTypes<A>>(
	value: unknown,
	actionType: E,
): value is ActionTypes<A>[E] =>
	type(value) === "table" && tostring(getmetatable(value as object)) === actionType;
