import Signal from "@rbxts/signal";
import { UserInputService as IS } from "@rbxts/services";
import { Bin } from "@rbxts/bin";
import { ActionEntry, RawActionEntry } from "../Definitions/Types";

import * as t from "./TypeChecks";

function checkInputs(
        action: ActionEntry,
        { KeyCode, UserInputType }: InputObject,
        processed: boolean,
        callback: (processed: boolean) => void,
) {
        const context = action.Context;
        
        if (context) {
                const { Options: { Process } } = context;

                const RawAction = action.RawAction as RawActionEntry;
        
                if (
                        t.isActionEqualTo(RawAction, KeyCode, UserInputType) &&
                        (Process === undefined || Process === processed)
                ) {
                        callback(processed);
                }
        }
}

export class ActionConnection {
        private bin;

        private constructor(private action: ActionEntry) {
                this.bin = new Bin();

                const conn = action.Destroyed.Connect(() => {
                        conn.Disconnect();

                        this.bin.destroy();
                        this.action.SetContext(undefined);
                });
        }

        private Connect(signal: Signal, callback: (...args: Array<any>) => void) {
                this.bin.add(signal.Connect(callback));
        }

        static From(action: ActionEntry) {
                return new ActionConnection(action);
        }

        Began(callback: (processed?: boolean) => void) {
                this.bin.add(
                        IS.InputBegan.Connect((input, processed) => 
                                checkInputs(this.action, input, processed, callback)
                        )
                );
        }

        Ended(callback: (processed?: boolean) => void) {
                this.bin.add(
                        IS.InputEnded.Connect((input, processed) => 
                                checkInputs(this.action, input, processed, callback)
                        )
                );
        }

        Destroyed(callback: () => void) {
                this.Connect(this.action.Destroyed, callback);
        }

        Triggered(callback: (processed?: boolean) => void) {
                this.Connect(this.action.Triggered, callback);
        }

        Released(callback: (processed?: boolean) => void) {
                this.Connect(this.action.Released, callback);
        }

        Changed(callback: () => void) {
                this.Connect(this.action.Changed, callback);
        }

        Cancelled(callback: () => void) {
                this.Connect(this.action.Cancelled, callback);
        }

        Destroy() {
                this.action.Destroyed.Fire();
        }
}