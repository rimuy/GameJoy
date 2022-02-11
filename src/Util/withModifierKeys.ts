import { Union } from "../Actions";

const entries = {
	Shift: [Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift],
	Alt: [Enum.KeyCode.LeftAlt, Enum.KeyCode.RightAlt],
	Meta: [Enum.KeyCode.LeftMeta, Enum.KeyCode.RightMeta],
	Control: [Enum.KeyCode.LeftControl, Enum.KeyCode.RightControl],
	Super: [Enum.KeyCode.LeftSuper, Enum.KeyCode.RightSuper],
} as const;

type ModifierEntries = typeof entries;

/**
 * Returns an union of a modifier key that contains both left and right keys.
 */
export function withModifierKeys<M extends keyof ModifierEntries>(key: M) {
	return new Union<ModifierEntries[M][number]["Name"]>(entries[key] as never);
}
