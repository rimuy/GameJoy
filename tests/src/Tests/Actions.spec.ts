/// <reference types="@rbxts/testez/globals" />

import { Context, Actions } from "@rbxts/gamejoy";

export = () => {
	const ctx = new Context();

	describe("Action", () => {
		const { Action } = Actions;

		it("Normal action", () => {
			const action = new Action("Q");
			let passed = false;

			ctx.Bind(action, () => {
				passed = true;
			});

			action.Triggered.Fire();

			expect(passed).to.equal(true);
		});
		it("Double tap", () => {
			const passed = new Array<boolean>(1);
			const cancelled = new Array<boolean>(1);

			const action = new Action("Q", {
				Repeat: 2,
				Timing: 0.3,
			});

			ctx.Bind(action, () => {
				passed.push(true);
			});

			action.Cancelled.Connect(() => {
				cancelled.push(true);
			});

			for (let i = 0; i < 2; i++) {
				action.Began.Fire(false);
				task.wait(0.25);
			}

			action.Began.Fire(false);

			task.wait(0.32);

			expect(passed.size()).to.equal(1);
			expect(cancelled.size()).to.equal(1);
		});
	});
};
