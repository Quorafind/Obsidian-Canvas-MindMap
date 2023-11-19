import { requireApiVersion, TFile } from "obsidian";

interface edgeT {
	fromOrTo: string;
	side: string,
	node: any,
}

export const random = (e: number) => {
	let t = [];
	for (let n = 0; n < e; n++) {
		t.push((16 * Math.random() | 0).toString(16));
	}
	return t.join("")
}

export const createChildFileNode = (canvas: any, parentNode: any, file: TFile, path: string, y: number) => {
	// const edge = canvas.edges.get(canvas.getData().edges.first()?.id);
	let tempChildNode;
	if(!requireApiVersion("1.1.10")) {
		tempChildNode = canvas.createFileNode(file, path, {
			x: parentNode.x + parentNode.width + 200,
			y: y,
			height: parentNode.height * 0.6,
			width: parentNode.width
		}, true);
	}
	else {
		tempChildNode = canvas.createFileNode({
			file: file,
			subpath: path,
			pos: {
				x: parentNode.x + parentNode.width + 200,
				y: y,
				width: parentNode.width,
				height: parentNode.height * 0.6
			},
			size: {
				x: parentNode.x + parentNode.width + 200,
				y: y,
				width: parentNode.width,
				height: parentNode.height * 0.6
			},
			save: true,
			focus: false,
		});
	}
	canvas.deselectAll();
	canvas.addNode(tempChildNode);

	// const tempEdge = new edge.constructor(canvas, random(16), {side: "right", node: parentNode}, {side: "left", node: tempChildNode})
	// canvas.addEdge(tempEdge);
	//
	// tempEdge.render();

	addEdge(canvas, random(16), {
		fromOrTo: "from",
		side: "right",
		node: parentNode
	},{
		fromOrTo: "to",
		side: "left",
		node: tempChildNode
	})
	canvas.requestSave();

	return tempChildNode;
}

export const addEdge = (canvas: any, edgeID: string, fromEdge: edgeT, toEdge: edgeT) => {
	if(!canvas) return;

	const data = canvas.getData();
	if(!data) return;

	canvas.importData({
		"edges": [
			...data.edges,
			{"id":edgeID,"fromNode":fromEdge.node.id,"fromSide":fromEdge.side,"toNode":toEdge.node.id,"toSide":toEdge.side}
		],
		"nodes": data.nodes,
	})

	canvas.requestFrame();
}
