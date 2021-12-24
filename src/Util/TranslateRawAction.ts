import aliases from "../Misc/Aliases";
import { AliasKey, RawAction, RawActionEntry } from "../Definitions/Types";

const check = (e: Enum.KeyCode | Enum.UserInputType, rawAction: RawActionEntry) =>
	e.Name === rawAction || e.Value === rawAction || e === rawAction;

export function TranslateRawAction(rawAction: RawActionEntry) {
	const entry = aliases.get(rawAction as AliasKey) ?? rawAction;

	return (Enum.UserInputType.GetEnumItems().find((e) => check(e, entry)) ||
		Enum.KeyCode.GetEnumItems().find((e) => check(e, entry))) as RawAction;
}
