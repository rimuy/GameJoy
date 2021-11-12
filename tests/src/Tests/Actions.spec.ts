/// <reference types="@rbxts/testez/globals" />

import { Context, Actions } from "@rbxts/gamejoy";

export = () => {
	const ctx = new Context();

	describe("Action", () => {
		const { Action } = Actions;

		it("Normal action", () => {
			const action = new Action("A");
			let passed = false;

			ctx.Bind(action, () => {
				passed = true;
			});

			action.Triggered.Fire();

			expect(passed).to.equal(true);
		});
		it("Double tap", () => {
			const passed = new Array<true>(2);
			const cancelled = new Array<true>(2);

			const action = new Action("D", {
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

			task.wait(0.4);

			expect(passed.size()).to.equal(1);
			expect(cancelled.size()).to.equal(1);
		});
	});
	describe("CompositeAction", () => {
		const { Action, Composite } = Actions;

		it("Composite of Q, E and R", () => {
			let passed = false;

			const q = new Action("Q");
			const e = new Action("E");
			const r = new Action("R");

			const comp = new Composite([q, e, r]);

			ctx.Bind(comp, () => {
				passed = true;
			});

			q.Began.Fire(false);
			e.Began.Fire(false);
			r.Began.Fire(false);

			expect(passed).to.equal(true);
		});
		it("Composite within another composite", () => {
			let passed = false;

			const q = new Action("Q");
			const e = new Action("E");
			const r = new Action("R");

			const comp = new Composite([q, new Composite([e, r])]);

			ctx.Bind(comp, () => {
				passed = true;
			});

			q.Began.Fire(false);
			e.Began.Fire(false);
			r.Began.Fire(false);

			expect(passed).to.equal(true);
		});
	});
	describe("DynamicAction", () => {
		const { Action, Dynamic } = Actions;

		it("Update", () => {
			const passed = new Array<true>(3);

			const q = new Action("Q");
			const e = new Action("E");
			const dyn = new Dynamic<"Q" | "E">(q);

			ctx.Bind(dyn, () => {
				passed.push(true);
			});

			q.Began.Fire(false);
			dyn.Update(e);
			e.Began.Fire(false);

			expect(passed.size()).to.equal(2);
			expect(q.Context).to.never.be.ok();
			expect(e.Context).to.equal(ctx);
		});
	});
	describe("OrderedAction", () => {
		const { Action, Ordered, Optional } = Actions;

		it("List of actions", () => {
			const passed = new Array<true>(2);

			const q = new Action("Q");
			const e = new Action("E");
			const ordered = new Ordered([q, e]);

			ctx.Bind(ordered, () => {
				passed.push(true);
			});

			e.Began.Fire(false);
			q.Began.Fire(false);

			q.Began.Fire(false);
			e.Began.Fire(false);

			expect(passed.size()).to.equal(1);
		});
		it("With an optional action", () => {
			const passed = new Array<true>(3);

			const q = new Action("Q");
			const e = new Action("E");
			const r = new Action("R");
			const optionalR = new Optional(r);
			const ordered = new Ordered([q, e, optionalR]);

			ctx.Bind(ordered, () => {
				passed.push(true);
			});

			q.Began.Fire(false);
			e.Began.Fire(false);
			r.Began.Fire(false);

			expect(passed.size()).to.equal(2);
		});
	});
};
