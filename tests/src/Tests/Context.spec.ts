/// <reference types="@rbxts/testez/globals" />

import { Context, Actions } from "@rbxts/gamejoy";

export = () => {
	const { Action } = Actions;
	const noop = () => {};

	describe("Methods", () => {
		const ctx = new Context();
		const action = new Action("Q");
		const action2 = new Action("E");

		it("Context.Options", () => {
			expect(ctx.Options).to.be.a("table");
		});

		it("Context.Bind", () => {
			ctx.Bind(action, noop).Bind(action2, noop);

			expect(ctx.Has(action)).to.be.ok();
			expect(ctx.Has(action2)).to.be.ok();
		});

		it("Context.Unbind", () => {
			ctx.Unbind(action).Unbind(action2);

			expect(!ctx.Has(action)).to.be.ok();
			expect(!ctx.Has(action2)).to.be.ok();
		});

		it("Context.UnbindAll", () => {
			ctx.Bind(action, noop).Bind(action2, noop);

			ctx.UnbindAll();

			expect(!ctx.Has(action)).to.be.ok();
			expect(!ctx.Has(action2)).to.be.ok();
		});
	});

	describe("Options", () => {
		const action = new Action("Q");
		const action2 = new Action("E");

		it("OnBefore", () => {
			const ctx = new Context({
				OnBefore: () => false,
			});

			const obj = { value: false };

			ctx.Bind(action, () => {
				obj.value = true;
			});

			action.Triggered.Fire();

			task.wait(0.3);

			expect(!obj.value).to.be.ok();
		});

		it("RunSynchronously", () => {
			const ctx = new Context({
				RunSynchronously: true,
			});

			const obj = { a: false, b: false };

			ctx.Bind(action, () => {
				obj.a = true;
				task.wait(1);
			}).Bind(action2, () => {
				obj.b = true;
			});

			task.wait(0.3);

			expect(obj.a && obj.b).to.be.ok();
		});
	});
};
