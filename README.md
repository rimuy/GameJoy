<div align="center">
        <h1>GameJoy</h1>
        <a href="https://github.com/HylianBasement/gamejoy/actions">
                <img src="https://github.com/HylianBasement/gamejoy/workflows/CI/badge.svg" alt="CI Status" />
        </a>
        <a href="https://opensource.org/licenses/MIT">
		<img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
	</a>
	<a href="https://www.npmjs.com/package/@rbxts/gamejoy">
		<img src="https://badge.fury.io/js/%40rbxts%2Fgamejoy.svg" />
	</a>
        <br/>
        A simple class-based input library made with roblox-ts
</div>

<br/>
<div align="center">
        <pre>npm i <a href="https://www.npmjs.com/package/@rbxts/gamejoy">@rbxts/gamejoy</a></pre>
</div>
<br/>

```js
import { Context } from "@rbxts/gamejoy";

const context = new Context();

context.Bind(["MouseButton1", "Q"], () => {
        print("Hello world!");
});
```

## Installation

### npm
Simply execute the command below to install it to your [roblox-ts](https://roblox-ts.com/) project.
```bash
npm i @rbxts/gamejoy
```

### Wally
> TODO

## Table of Contents

- [Installation](#installation)
  * [npm](#npm)
  * [Wally](#wally)
- [Context](#context)
  * [OnBefore](#onbefore)
  * [Process](#process)
  * [RunSynchronously](#runsynchronously)
- [Creating an Action](#creating-an-action)
  * [Raw Actions](#raw-actions)
  * [Filtering multiple inputs](#filtering-multiple-inputs)
  * [Composing inputs into an action](#composing-inputs-into-an-action)
  * [Using a specific order of inputs](#using-a-specific-order-of-inputs)
  * [Making one of the inputs optional](#making-one-of-the-inputs-optional)
  * [Updating an existing action](#updating-an-existing-action)
  * [Using an Axis](#using-an-axis)
  * [Creating a conditional action](#creating-a-conditional-action)
  * [Whitelisting actions from async behaviour](#whitelisting-actions-from-async-behaviour)
- [Removing actions](#removing-actions)
- [License](#license)

## Context
To get started, you need to instantiate `Context`. A **context** contains all the actions that bound to it, and is responsible for making them successfully trigger. After that, you'll want to choose want kind of action we want to use by destructuring `Actions`.

For this example, we'll be using `Action`.

```js
import { Actions, Context } from "@rbxts/gamejoy";

const { Action } = Actions;
const context = new Context();
```

> `Context` can be instantiated with an object parameter, used for configuration.

#### OnBefore
Applies a check on every completed action. If the check fails, the action won't be triggered.

#### Process
Specifies that the action should be triggered if `gameProcessedEvent` matches the setting. If nothing is passed, the action will trigger independently.

#### RunSynchronously
Specifies if the actions are going to run synchronously or not.

## Creating an Action
An **action** is an object that holds information about inputs that can be performed by the player while in a context. This can vary from a single action, to multiple ones. Actions be nested! which means that actions that accept multiple entries can have actions that contain other actions, and so on.

```js
const action = new Action("Q");

context.Bind(action, () => {
        print("Q was pressed!");
});

action.Released.Connect(() => {
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

context.Bind(runAction, () => {
        isRunning = true;
});

runAction.Released.Connect(() => {
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
It accepts an array of action/raw-action entries as a parameter.

In this example, you create an **union** of F and ButtonB. If one of these keys are pressed, the action will be triggered.

```js
const union = new Union(["F", "ButtonB"]);

context.Bind(union, () => {
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

### Composing inputs into an action
What about having to press multiple keys at the same time to trigger an action? Well, `Composite` is what you're looking for. In a **composite**, the action will only trigger if all of its children actions are completed.

```js
const composite = new Composite(["J", "K", "L"]);

context.Bind(composite, () => {
        print("You pressed J, K and L!");
});
```

`Composite` is cancellable. When one of the keys is released, it'll trigger the `Cancelled` event. If there is already an action being executed and the composite was already queued, it'll remove the composite from the queue, preventing it to be triggered. This doesn't apply if `RunSynchronously` is set to true.

```js
composite.Cancelled.Connect(() => {
        print("Composite was cancelled.");
});
```

### Using a specific order of inputs
Now if you want a composite, but need it to require the actions to be executed in a specific order, try `Sequence`!

```js
context.Bind(new Sequence(["LeftAlt", "E"]), () => {
        print("Yay");
});
```

> Just like `Composite`, `Sequence` is also cancellable.

### Making one of the inputs optional
Actions that require all of its children entries to be completed, such as `Composite` and `Sequence`, can contain an **optional** action.

```js
context
        .Bind(new Composite(["F", new Optional("G")]), () => {
                // ...
        })
        .Bind(new Sequence(["F", new Optional("G")]), () => {
                // ...
        });
```

In both cases, the action is gonna be triggered if `F` is pressed, and then triggered again if `G` is pressed while `F` is still being hold.

It's common to store the optional action in a variable to get its information later, like knowing whether it's pressed or not.

```js
const optional = new Optional("G");

context.Bind(new Composite(["F", optional]), () => {
        if (optional.IsPressed) {
                // ...
        }
});
```

### Updating an existing action
Thanks to `Dynamic`, updating actions is a very easy task. You can store any action/raw-action inside it to make it updatable. Since **dynamic** actions are limited to a type, you'll need to create a type to filter what input will be available for the action to update.

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
context.Bind(new Middleware("M", () => os.time() % 2 === 0), () => {
        print("Works sometimes...");
});
```

### Whitelisting actions from async behaviour
Just like the above, `Sync` also aims to apply a configuration trait to a specific action, this time replicating the `RunSynchronously` option.

```js
context.Bind(new Sync("C"), () => {
        print("This was triggered synchronously!");
});
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
        .UnbindAll();    // Unbinds all of the remaining bound actions
```

## License
This project is [MIT licensed](LICENSE).