import { UserInputService as IS } from "@rbxts/services";

import { LayoutKind, translateKeyCode } from "../Misc/KeyboardLayout";

import { RawActionEntry } from "../definitions";

import { extractEnum } from "./ExtractEnum";

import * as t from "./TypeChecks";

function check(rawAction: RawActionEntry, layout: LayoutKind) {
	const input = extractEnum(rawAction);

	if (t.isMouseButton(input)) {
		return IS.IsMouseButtonPressed(input);
	} else if (t.isKeyCode(input)) {
		return IS.IsKeyDown(translateKeyCode(input, layout));
	}

	return false;
}

/**
 * Checks if all the specified inputs are being pressed.
 */
export function isInputDown(
	input: RawActionEntry | Array<RawActionEntry>,
	keyboardLayout: LayoutKind = LayoutKind.QWERTY,
) {
	return (t.isRawActionArray(input) ? input : [input]).every((x) => check(x, keyboardLayout));
}

/**
 * Checks if any of the specified inputs is being pressed.
 */
export function isAnyInputDown(
	inputs: Array<RawActionEntry>,
	keyboardLayout: LayoutKind = LayoutKind.QWERTY,
) {
	return inputs.some((x) => check(x, keyboardLayout));
}
