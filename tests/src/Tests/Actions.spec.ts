/// <reference types="@rbxts/testez/globals" />

import { Context, Actions, ActionEntry } from "@rbxts/gamejoy";

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
		const { Action, Composite, Optional } = Actions;

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
		it("Within another composite", () => {
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
		it("With an optional action", () => {
			const passed = new Array<true>(3);

			const q = new Action("Q");
			const e = new Action("E");
			const r = new Action("R");
			const comp = new Composite([q, e, new Optional(r)]);

			ctx.Bind(comp, () => {
				passed.push(true);
			});

			q.Began.Fire(false);
			e.Began.Fire(false);
			r.Began.Fire(false);

			expect(passed.size()).to.equal(2);
		});
	});
	describe("DynamicAction", () => {
		const { Action, Dynamic } = Actions;

		it("Update", () => {
			const passed = new Array<true>(3);

			const j = new Action("J");
			const k = new Action("K");
			const dyn = new Dynamic<"J" | "K">(j);

			ctx.Bind(dyn, () => {
				passed.push(true);
			});

			j.Began.Fire(false);
			dyn.Update(k);
			k.Began.Fire(false);

			expect(passed.size()).to.equal(2);
			expect(j.Context).to.never.be.ok();
			expect(k.Context).to.equal(ctx);
		});
	});
	describe("MiddlewareAction", () => {
		const { Action, Middleware } = Actions;

		it("Action check with pair numbers", () => {
			const passed = new Array<true>(6);

			const q = new Action("Q");
			let n = 0;

			ctx.Bind(new Middleware(q, () => n % 2 === 0), () => {
				passed.push(true);
			});

			for (let i = 0; i <= 6; i++) {
				q.Began.Fire(false);
				n++;
			}

			expect(passed.size()).to.equal(4);
		});
	});
	describe("SequenceAction", () => {
		const { Action, Optional, Sequence } = Actions;

		function executeOrder(arr: Array<ActionEntry>, active: boolean) {
			for (const action of arr) {
				action[active ? "Triggered" : "Released"].Fire(false);
				task.wait();
			}
		}

		it("List of actions", () => {
			const passed = new Array<true>(2);

			const q = new Action("Q");
			const e = new Action("E");
			const sequence = new Sequence([q, e]);

			ctx.Bind(sequence, () => {
				passed.push(true);
			});

			executeOrder([e, q], true);
			executeOrder([e, q], false);

			executeOrder([q, e], true);

			expect(passed.size()).to.equal(1);
		});
		it("With an optional action", () => {
			const passed = new Array<true>(3);

			const q = new Action("Q");
			const e = new Action("E");
			const r = new Action("R");
			const sequence = new Sequence([q, e, new Optional(r)]);

			ctx.Bind(sequence, () => {
				passed.push(true);
			});

			executeOrder([r, e, q], true);
			executeOrder([r, e, q], false);

			executeOrder([q, e, r], true);

			expect(passed.size()).to.equal(2);
		});
	});
	describe("SynchronousAction", () => {
		const { Action, Sync } = Actions;

		it("Normal action and a synchronous action", () => {
			const passed = new Array<true>(3);

			const q = new Action("Q");
			const e = new Sync("E");

			ctx.Bind(q, () => {
				passed.push(true);
				task.wait(1);
			});

			ctx.Bind(e, () => {
				passed.push(true);
			});

			q.Began.Fire(false);
			q.Began.Fire(false);
			e.Triggered.Fire();

			expect(passed.size()).to.equal(2);
		});
	});
	describe("UnionAction", () => {
		const { Action } = Actions;

		it("List of actions", () => {
			const passed = new Array<true>(2);

			const m = new Action("M");
			const n = new Action("N");

			ctx.Bind([m, n], () => {
				passed.push(true);
			});

			m.Began.Fire(false);
			n.Began.Fire(false);

			expect(passed.size()).to.equal(2);
		});
	});
};
