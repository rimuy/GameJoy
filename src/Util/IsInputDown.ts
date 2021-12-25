import { UserInputService as IS } from "@rbxts/services";

import { RawActionEntry } from "../Definitions/Types";

import { TranslateRawAction } from "./TranslateRawAction";

import * as t from "../Util/TypeChecks";

function check(input: RawActionEntry) {
	if (t.isMouseButtonAction(input)) {
		return IS.IsMouseButtonPressed(TranslateRawAction(input) as Enum.UserInputType);
	} else if (!t.isActionEqualTo(input, Enum.KeyCode.Unknown)) {
		return IS.IsKeyDown(TranslateRawAction(input) as Enum.KeyCode);
	} else {
		return false;
	}
}

/**
 * Checks if all the specified inputs are being pressed.
 */
export function IsInputDown(input: RawActionEntry | Array<RawActionEntry>) {
	return (t.isRawActionArray(input) ? input : [input]).every((x) => check(x));
}

/**
 * Checks if any of the specified inputs is being pressed.
 */
export function IsAnyInputDown(inputs: Array<RawActionEntry>) {
	return inputs.some((x) => check(x));
}
