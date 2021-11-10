interface ReplicatedStorage extends Instance {
	include: { node_modules: { testez: { src: ModuleScript } } };
}

interface ServerScriptService extends Instance {
	Tests: Folder;
}
