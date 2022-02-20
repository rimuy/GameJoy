import { lazyRegister } from "../Misc/Lazy";

import { Action } from "./Action";
lazyRegister("Action", Action);

import { AxisAction as Axis } from "./AxisAction";
lazyRegister("Axis", Axis);

export { CompositeAction as Composite } from "./CompositeAction";
export { DynamicAction as Dynamic } from "./DynamicAction";
export { ManualAction as Manual } from "./ManualAction";
export { OptionalAction as Optional } from "./OptionalAction";
export { SequenceAction as Sequence } from "./SequenceAction";
export { SynchronousAction as Sync } from "./SynchronousAction";

import { UnionAction as Union } from "./UnionAction";
lazyRegister("Union", Union);

export { UniqueAction as Unique } from "./UniqueAction";

export { Action, Axis, Union };
