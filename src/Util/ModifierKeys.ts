import { RawActionEntry } from "../Definitions/Types";
import { Union } from "../Actions";

// type ModifierEnum =
// 	| Enum.KeyCode.LeftShift
// 	| Enum.KeyCode.RightShift
// 	| Enum.KeyCode.LeftMeta
// 	| Enum.KeyCode.RightMeta
// 	| Enum.KeyCode.LeftAlt
// 	| Enum.KeyCode.RightAlt
// 	| Enum.KeyCode.LeftControl
// 	| Enum.KeyCode.RightControl
// 	| Enum.KeyCode.LeftSuper
// 	| Enum.KeyCode.RightSuper;

type ModiferKey = "Shift" | "Alt" | "Meta" | "Control" | "Super";

const unions: Record<ModiferKey, [RawActionEntry, RawActionEntry]> = {
	Shift: [Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift],
	Alt: [Enum.KeyCode.LeftAlt, Enum.KeyCode.RightAlt],
	Meta: [Enum.KeyCode.LeftMeta, Enum.KeyCode.RightMeta],
	Control: [Enum.KeyCode.LeftControl, Enum.KeyCode.RightControl],
	Super: [Enum.KeyCode.LeftSuper, Enum.KeyCode.RightSuper],
};

/**
 * Returns an union of a modifier key that contains both left and right keys.
 */
export function ModifierKeys<M extends ModiferKey>(key: M) {
	return new Union(unions[key]);
}
