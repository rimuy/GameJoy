# API

## Actions

### Action
An **action** is an object that holds information about inputs that can be performed by the player while in a context. This can vary from a single action, to multiple ones. Actions be nested! which means that actions that accept multiple entries can have actions that contain other actions, and so on.

```js
const action = new Action("Q");

context
        .Bind(action, () => {
                print("Q was pressed!");
        })
        .BindEvent("onReleased", action.Released, () => {
                print("Q was released!");
        });
```

`Action` also accepts an object as the second parameter, used for configuration. The amount of times a key needs to be pressed and the maximum time between each press can be set up.

```js
let isRunning = false;

const runAction = new Action("W", {
        Repeat: 2,
        Timing: 0.3,
});

context
        .Bind(runAction, () => {
                isRunning = true;
        })
        .BindEvent("onRunningStopped", runAction.Released, () => {
                isRunning = false;
        });
```

> Everytime an action is triggered, it'll fire the `Triggered` event.

### Union
Accepts multiple entries as a parameter and triggers whenever one of its entries is triggered.

```js
context.Bind(new Union(["F", "ButtonB"]), () => {
        print("You pressed either F or ButtonB!");
});
```

### Unique
Requires **only one** of its entries to be active for it to trigger.

```js
context.Bind(new Unique(["C", "V"]), () => {
        print("Either C or V... but one must be inactive for the another one to work.");
});
```

### Composite
What about having to press multiple keys at the same time to trigger an action? Well, `Composite` is what you're looking for. In a **composite**, the action will only trigger if all of its children actions are completed.

```js
context.Bind(new Composite(["J", "K", "L"]), () => {
        print("You pressed J, K and L!");
});
```

### Sequence
Requires all of its entries to be active in a specific order for it to trigger.

```js
context.Bind(new Sequence(["LeftAlt", "E"]), () => {
        print("Yay");
});
```

`Sequence` is cancellable. When one of the keys is released, it'll trigger the `Cancelled` event. If there is already an action being executed and the composite was already queued, it'll remove the composite from the queue, preventing it from being triggered. This doesn't apply if `RunSynchronously` is set to true.

```js
context.Bind(useEvent(sequence.Cancelled), () => {
        print("Composite was cancelled.");
});
```

### Optional
Acts as a "ghost" action when placed inside objects that accepts multiple entries.
Its parent action can trigger without the need of the action being active, and will trigger again once the action activates.

Some variants that requires multiple entries (`Composite`, `Sequence` and `Unique`), can contain an **optional** action.

```js
context
        .Bind(new Composite(["F", new Optional("G")]), () => {
                // ...
        })
        .Bind(new Sequence(["F", new Optional("G")]), () => {
                // ...
        })
        .Bind(new Unique(["F", new Optional("G"), "H"]), () => {
                // ...
        });
```

In both `Composite` and `Sequence`, the action is gonna be triggered if `F` is pressed, and then triggered again if `G` is pressed while `F` is still being hold. The difference is that in `Sequence`, the optional action must be activated in the right order.

In `Unique`, the optional action will be able to break its parent object rules, triggering `Unique` even if a child action is already active.

It's common to store the optional action in a variable to get its information later, like knowing whether it's pressed or not.

```js
const optional = new Optional("G");

context.Bind(new Composite(["F", optional]), () => {
        if (optional.IsActive) {
                print("Do a barrel roll!");
        }
});
```

### Dynamic
Thanks to `Dynamic`, updating actions is a very easy task. You can store any action-like inside it to make it updatable. Since **dynamic** actions are limited to a type, you'll need to create a type to filter what input will be available for the action to update.

```ts
type ActionThatChanges = "X" | "Y" | "Z";

const dynamic = new Dynamic<ActionThatChanges>("X");

context.Bind(dynamic, () => {
        print(dynamic.RawAction);
});

task.wait(1);

dynamic.Update("Y");

task.wait(1);

dynamic.Update("Z");
```

For multiple input actions, you'll want to include the type of all its entries into your type.

```ts
type ActionThatChanges = "X" | "Y" | "Z" | "A" | "B";

const dynamic = new Dynamic<ActionThatChanges>(new Composite(["A", "B"]));
```

> The `AnyAction` type can be used if you don't want to filter the entries.

### Axis
`Axis` provides support for inputs that have a continuous range. The action is triggered everytime the input is changed.
This is mostly used with joysticks, for when you want to map player movement using an analogic button, or to know how pressed down are its upper buttons.

```js
context
        .Bind(new Axis("MouseMovement"), (position, delta) => {
                print(delta);
                print(position.X, position.Y);
        })
        .Bind(new Axis("Thumbstick1"), (position) => {
                print(position.X, position.Y);
        })
        .Bind(new Axis("ButtonL2"), (position) => {
                print(position);
        });
```

<!-- ### Creating a conditional action
Sometimes you want to specify when an action can be triggered, but don't want to configure the context to do so, because that would apply the check for all the bound actions. `Middleware` accepts a callback that can be used to set a condition to your action.

```js
const timeMiddleware = () => os.time() % 2 === 0;

context.Bind(new Middleware("M", timeMiddleware), () => {
        print("Works half of the time, haha...");
});
``` -->

### Sync
Just like the above, `Sync` also aims to apply a configuration trait to a specific action, this time replicating the `RunSynchronously` option, making a specific action able to trigger synchronously.

```js
context
        .Bind("A", () => { task.wait(5); })
        .Bind("B", () => print("Needs to wait till A is done..."))
        .Bind(new Sync("C"), () => {
                print("Will be executed even if there is already a pending action!");
        });
```

> `Context.BindSync` can be used instead.

### Manual
`Manual` is an action-like alternative to a bound event. Contains a `Trigger` method with custom parameters that can be used in its listener.

```ts
const manual = new Manual<[string, number]>();

context.Bind(manual, (name, age) => print(name, age));

manual.Trigger("Kevin", 19);
```

## Hooks
> TODO