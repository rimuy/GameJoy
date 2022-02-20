# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]
This update introduces a lot of breaking changes.

### Added
* Added aliases for mouse buttons and most special characters.
* Added four hooks: `useEvent`, `useMiddleware`, `useParameters` and `useThrottle`. ([#8](https://github.com/Rimuy/GameJoy/issues/8))
* Added `KeyboardLayout` context option, which accepts a `LayoutKind` enum item. ([#11](https://github.com/Rimuy/GameJoy/issues/11))
* Added `LayoutKind` and `GamepadKind` enums.
* Added `extractEnum` utility function.
* Added `isAxis1d`, `isAxis2d` & `isAxisGyro` type check functions.

### Changed
* **[BREAKING CHANGE]** Removed `BindEvent` & `BindSyncEvent` in favour of `useEvent` and `BindSync`.
* **[BREAKING CHANGE]** Removed `Middleware` action in favour of the `useMiddleware` hook.
* **[BREAKING CHANGE]** Made `Delta` and `Position` fields of `AxisAction` private.
* Changed `AxisAction` to have parameters instead of class fields.
* Context's `OnBefore` assertion now also accepts a boolean promise return.
* `isInputDown` utility function now accepts an optional `LayoutKind` parameter.

## [1.1.4]
### Fixed
* Fixed wally build

## [1.1.1]
### Added
* Added `BaseAction.IsBound()` method.

### Fixed
* Fixed actions calling `OnConnected` more than once.

## [1.1.0]
### Added
* Added `ManualAction`. Variant that is used to act as a placeholder for manual triggering.
* Added `UniqueAction`. Variant that requires **only one** of its entries to be active for it to trigger.
* Added `Context.BindEvent` method. Registers and connects an event into the context.
* Added `Context.BindSyncEvent` method for synchronous events.
* Added `Context.UnbindEvent`. Removes an event connection from the context.
* Added `Context.UnbindAllActions`. Removes all bound actions from the context.
* Added `Context.UnbindAllEvents`. Removes all bound events from the context.
* Added `isCancellableAction` type check util.

### Changed
* Upgraded docs!
* Actions no longer show events that is useless to its class.
* Renamed `isMouseButtonAction` type check util to `isMouseButton`.

### Fixed
* Fixed error when calling `print` on an unready action object.
* Fixed action size priority and action-ghosting checks being ignored on synchronous actions.
* Fixed AnyAction type error on DynamicAction.
* Fixed DynamicAction not updating its content string.
* Fixed AxisAction throwing when checking if the input was down.

## [1.0.2]
### Fixed
* Fixed actions not yielding when using async functions.

## [1.0.0]
This is the first stable release.

### Added
* Added `Action`
* Added `AxisAction`
* Added `CompositeAction`
* Added `DynamicAction`
* Added `MiddlewareAction`
* Added `OptionalAction`
* Added `SequenceAction`
* Added `SynchronousAction`
* Added `UnionAction`