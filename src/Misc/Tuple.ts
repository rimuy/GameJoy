export function tuple<T extends Array<any>>(...elements: T) {
	const newElements = new Array<defined>(elements.size());

	for (let i = 0; i < elements.size(); i++) {
		const e = (elements as Array<defined>)[i];

		if (e !== undefined) {
			newElements.push(e!);
		}
	}

	return newElements as LuaTuple<T>;
}
