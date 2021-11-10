import type TestEZ from "@rbxts/testez";

// eslint-disable-next-line
const { TestBootstrap } = require(game.GetService("ReplicatedStorage").include.node_modules.testez.src) as TestEZ;
const { errors, failureCount } = TestBootstrap.run([game.GetService("ServerScriptService").Tests]);

if (errors.size() > 0 || failureCount > 0) {
	error("Tests failed!");
}
