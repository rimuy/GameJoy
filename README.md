<div>
        <img align="left" src="https://i.imgur.com/yO4KX2M.png" height="200" width="150">
                <h1><code>GameJoy</code></h1>
                <p>A simple class-based input library made with roblox-ts.</p>
        </img>
</div>

---

[![CI Status](https://github.com/HylianBasement/gamejoy/workflows/CI/badge.svg)](https://github.com/HylianBasement/gamejoy/actions)
[![NPM Package](https://badge.fury.io/js/%40rbxts%2Fgamejoy.svg)](https://www.npmjs.com/package/@rbxts/gamejoy)
[![Wally Package](https://img.shields.io/badge/wally%20package-2.0.0-red)](https://wally.run/package/rimuy/gamejoy)
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
See [API](API.md) for reference. 

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
        .Bind(["Mouse1", "ButtonX"], () => {
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
        context
                .Bind(useEvent(CharacterController.Damaged), (oldHealth, health) => {
                        const damage = oldHealth - health;
                        print(`You lost ${damage}HP!`);

                        task.wait(0.3); // The player must wait 0.3 seconds before being able to counter-attack.
                })
                .BindSync(useEvent(RunService.RenderStepped), (delta) => {
                        print(delta);
                });
        ```
- ### Utilitaries
    There are some utilitary functions available, such as typechecks.
- ### Hooks
    Hooks are utilitary functions that returns an action with custom behaviour. One of those hooks can give the ability to bind events using actions, like used above.
    
    ```js
    context.Bind(useEvent(Character.Humanoid.HealthChanged), (health) => {
        print("New health:", health);
    });
    ```

## Raw Actions
An action entry doesn't necessarily need to be an instantiated class, it could be a string, number or an enum item corresponding to the correct name or value from `Enum.KeyCode` and `Enum.UserInputType`.

```js
context
        .Bind("F", () => {
                print("F was pressed!");
        })
        .Bind(["Q", "E"], () => {
                print("Q or E was pressed!");
        });
```

Of course, you won't be able to use any event that you could use with an action object.

## Filtering multiple inputs
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
