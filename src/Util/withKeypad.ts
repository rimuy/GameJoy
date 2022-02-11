import { Union } from "../Actions";

const entries = {
	["0"]: [Enum.KeyCode.Zero, Enum.KeyCode.KeypadZero],
	["1"]: [Enum.KeyCode.One, Enum.KeyCode.KeypadOne],
	["2"]: [Enum.KeyCode.Two, Enum.KeyCode.KeypadTwo],
	["3"]: [Enum.KeyCode.Three, Enum.KeyCode.KeypadThree],
	["4"]: [Enum.KeyCode.Four, Enum.KeyCode.KeypadFour],
	["5"]: [Enum.KeyCode.Five, Enum.KeyCode.KeypadFive],
	["6"]: [Enum.KeyCode.Six, Enum.KeyCode.KeypadSix],
	["7"]: [Enum.KeyCode.Seven, Enum.KeyCode.KeypadSeven],
	["8"]: [Enum.KeyCode.Eight, Enum.KeyCode.KeypadEight],
	["9"]: [Enum.KeyCode.Nine, Enum.KeyCode.KeypadNine],
	["Plus"]: [Enum.KeyCode.Plus, Enum.KeyCode.KeypadPlus],
	["Equals"]: [Enum.KeyCode.Equals, Enum.KeyCode.KeypadEquals],
	["Minus"]: [Enum.KeyCode.Minus, Enum.KeyCode.KeypadMinus],
	["Period"]: [Enum.KeyCode.Period, Enum.KeyCode.KeypadPeriod],
} as const;

type KeypadEntries = typeof entries;

/**
 * Returns an union containing a number key and its numpad equivalent.
 */
export function withKeypad<K extends keyof KeypadEntries>(key: K) {
	return new Union<KeypadEntries[K][number]["Name"]>(entries[key] as never);
}
