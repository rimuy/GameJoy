<div>
        <img align="left" src="https://i.imgur.com/yO4KX2M.png" height="200" width="150">
                <h1><code>GameJoy</code></h1>
                <p>A simple class-based input library made with roblox-ts.</p>
        </img>
</div>

---

[![CI Status](https://github.com/HylianBasement/gamejoy/workflows/CI/badge.svg)](https://github.com/HylianBasement/gamejoy/actions)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Package](https://badge.fury.io/js/%40rbxts%2Fgamejoy.svg)](https://www.npmjs.com/package/@rbxts/gamejoy)
<br/>
<br/>

## Installation
### npm
Simply execute the command below to install it to your [roblox-ts](https://roblox-ts.com/) project.
```bash
npm i @rbxts/gamejoy
```

### Wally
For [wally](https://wally.run/) users, the package can be installed by adding the following line into their `wally.toml`.
```cs
[dependencies]
GameJoy = "rimuy/gamejoy@2.0.0"
```

After that, just run `wally install`.

### From model file
Model files are uploaded to every release as `.rbxmx` files. You can download the file from the [Releases page](https://github.com/HylianBasement/GameJoy/releases) and load it into your project however you see fit.

## Features
- ### Class-based
    Because action bindings are actually classes, the user has the ability to check whether an action is active or not, and to use its respective methods and events for better manipulation. We want to choose what kind of action we want to use by destructuring `Actions`.

    These are all the action classes that are currently available:

    ```js
    import { Action, Axis, Dynamic, Manual, Optional, Sequence, Sync, Union, Unique } from "@rbxts/gamejoy";
    ```
    - #### Aliases
        To shorten some existing keycode names, the library provides a ton of aliases that can be used instead.
        All aliases can be found [here](https://github.com/HylianBasement/GameJoy/blob/main/src/Misc/Aliases.ts).
- ### Context oriented
    In order for actions to trigger, they must have a context where they belong to. A **context** contains all the actions that bound to it, and is responsible for making them successfully trigger.

    ```js
    import { Context } from "@rbxts/gamejoy";

    const context = new Context({
            /**
             * Limits the amount of actions that can trigger if those have any raw action in common.
             * If set to 0, this property will be ignored. (defaults to 0)
             */
            ActionGhosting: 1,
            /**
             * (defaults to QWERTY)
             */
            KeyboardLayout: LayoutKind.QWERTY,
            /**
             * Applies a check on every completed action. 
             * If the check fails, the action won't be triggered. (defaults to () => true)
             */
            OnBefore: () => !!Player.Character,
            /**
             * Specifies that the action should trigger if gameProcessedEvent matches the setting.
             * If nothing is passed, the action will trigger independently. (defaults to nil)
             */
            Process: false,
            /**
             * Specifies if the actions are going to run synchronously or not.
             * This will ignore the action queue and resolve the action instantly. (defaults to false)
             */
            RunSynchronously: false,
    });

    context
        .Bind(["Mouse1", "ControlX"], () => {
                CharacterController.Attack();
        })
        .Bind(["E", "R2"], () => {
                CharacterController.Block();
        });
    ```
    - #### Queued actions
        GameJoy contains a built-in action queue that automatically removes a resolved action from the queue and then executes the next one that was triggered, if the same is still pending. Every action that is successfully triggered, is sent to that queue, which will have the following behavior:

        **Situation 1:** You press `Q`, then `E`. Since `Q` was the first one to be triggered, it's gonna be instantly executed. `Q` lasts 3 seconds and `E` is supposed to be triggered after it ends. If the `E` key becomes up, it's gonna be removed from the queue.

        **Situation 2:** You press `Q`, `E` and then `R`. This follows the same pattern from situation 1. When you cancel `E`, `R` is gonna be the next action to be executed, since its position in the queue was right after `E`.

        In both cases, everytime an action is added to the queue, it will try to execute whatever action is in its first position.
        Once the action resolved or rejected, the process will start all over again, until the queue becomes empty.

        > This behavior can be disabled by setting the context's `RunSynchronously` option to `true`.
    - #### Event bindings
        Actions are not the only way to register something into the context, it's possible to even use events there!
        Events requires identifiers, so that it can be possible to unbind them when needed.

        ```js
        context.Bind(useEvent(CharacterController.Damaged), (oldHealth, health) => {
                const damage = oldHealth - health;
                print(`You lost ${damage}HP!`);

                task.wait(0.3); // The player must wait 0.3 seconds before being able to counter-attack.
        });
        ```

        ```js
        context.BindSync(useEvent(RunService.RenderStepped), (delta) => {
                print(delta);
        });
        ```
- ### Utilitaries
    There are some utilitary functions available, such as typechecks. Those are located in the `Util` namespace.

## Creating an Action
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

### Raw Actions
An action entry doesn't necessarily need to be an instantiated class, it could be a string, number or an enum item corresponding to the correct name or value from `Enum.KeyCode` and `Enum.UserInputType`.

```js
context.Bind("F", () => {
        print("F was pressed!");
});

context.Bind(["Q", "E"], () => {
        print("Q or E was pressed!");
});
```

Of course, you won't be able to use any event that you could use with an action object.

### Filtering multiple inputs
Sometimes don't you want two or more inputs to trigger the same action? Well, if so, `Union` is what you want!
It accepts an array of action-like entries as a parameter.

In this example, you create an **union** of F and ButtonB. If one of these keys are pressed, the action will be triggered.

```js
context.Bind(new Union(["F", "ButtonB"]), () => {
        print("You pressed either F or ButtonB!");
});
```

In addition, an union can also be a raw action instead of an action object! All you need to do is to replace its `Union` class with its own entry array instead.

```js
context.Bind(["F", "ButtonB"], () => {
        print("Easier to write :D");
});
```

> A single raw action gets transformed as `Action`, whereas an array of those gets transformed as `Union`.

### Triggering an action at once in a collection
With `Unique`, it's possible to have an `Union` that won't trigger if a child action is already active. Making it **unique**!

```js
context.Bind(new Unique(["C", "V"]), () => {
        print("Either C or V... but one must be inactive for the another one to work.");
});
```

### Composing inputs into an action
What about having to press multiple keys at the same time to trigger an action? Well, `Composite` is what you're looking for. In a **composite**, the action will only trigger if all of its children actions are completed.

```js
context.Bind(new Composite(["J", "K", "L"]), () => {
        print("You pressed J, K and L!");
});
```

### Using a specific order of inputs
Now if you want a composite, but need it to require the actions to be executed in a specific order, try `Sequence`!

```js
context.Bind(new Sequence(["LeftAlt", "E"]), () => {
        print("Yay");
});
```

`Sequence` is cancellable. When one of the keys is released, it'll trigger the `Cancelled` event. If there is already an action being executed and the composite was already queued, it'll remove the composite from the queue, preventing it from being triggered. This doesn't apply if `RunSynchronously` is set to true.

```js
context.BindEvent("onCancel", sequence.Cancelled, () => {
        print("Composite was cancelled.");
});
```

### Making one of the inputs optional
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

### Updating an existing action
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

### Using an Axis
`Axis` provides support for inputs that have a continuous range. The action is triggered everytime the input is changed.
This is mostly used with joysticks, for when you want to map player movement using an analogic button, or to know how pressed down are its upper buttons.

```js
const gamepad1 = new Axis("Gamepad1");
const mouse = new Axis("MouseMovement");
const thumbstick = new Axis("Thumbstick1");
const l2 = new Axis("ButtonL2");

context
        .Bind(gamepad1, () => {
                // Last controller button that was changed
                print(gamepad1.KeyCode);
                print(gamepad1.Delta);
                print(gamepad1.Position);
        })
        .Bind(mouse, () => {
                print(mouse.Delta);
                print(mouse.Position.X, mouse.Position.Y);
        })
        .Bind(thumbstick, () => {
                print(thumbstick.Position.X, thumbstick.Position.Y);
        })
        .Bind(l2, () => {
                print(l2.Position.Z);
        });
```

### Creating a conditional action
Sometimes you want to specify when an action can be triggered, but don't want to configure the context to do so, because that would apply the check for all the bound actions. `Middleware` accepts a callback that can be used to set a condition to your action.

```js
const timeMiddleware = () => os.time() % 2 === 0;

context.Bind(new Middleware("M", timeMiddleware), () => {
        print("Works half of the time, haha...");
});
```

### Whitelisting actions from async behavior
Just like the above, `Sync` also aims to apply a configuration trait to a specific action, this time replicating the `RunSynchronously` option, making a specific action able to trigger synchronously.

```js
context
        .Bind("A", () => { task.wait(5); })
        .Bind("B", () => print("Needs to wait till A is done..."))
        .Bind(new Sync("C"), () => {
                print("Will be executed even if there is already a pending action!");
        });
```

### Manually triggering an action
`Manual` is an action-like alternative to a bound event. Contains a `Trigger` method with custom parameters that can be used in its listener.

```ts
const manual = new Manual<[string, number]>();

context.Bind(manual, (name, age) => print(name, age));

manual.Trigger("Kevin", 19);
```

## Removing actions
To remove any action that is bound to a context, simply use the `Unbind` method. All bound actions can be removed at once when using `UnbindAll`.

```js
const action1 = new Action("X");
const action2 = new Action("Y");
const action3 = new Action("Z");

context
        .Bind(action1, /** ... */)
        .Bind(action2, /** ... */)
        .Bind(action3, /** ... */)
        .Unbind(action2) // Unbinds action2 from the context
        .UnbindAllActions();    // Unbinds all of the remaining bound actions
```

## License
This project is [MIT licensed](LICENSE).
