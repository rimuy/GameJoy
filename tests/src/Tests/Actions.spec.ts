/// <reference types="@rbxts/testez/globals" />

import { Context } from "@rbxts/gamejoy";

export = () => {
	const ctx = new Context();

	describe("Action", () => {
		it("should pass", () => {
			expect(1).to.be.an("number");
		});
	});
};
