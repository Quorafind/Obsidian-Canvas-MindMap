import { ItemView, MarkdownFileInfo, Notice, Plugin, TFile } from 'obsidian';
import { around } from "monkey-around";

export default class CanvasMindMap extends Plugin {

	async onload() {

		this.registerCommands();
		this.patchCanvas();
		this.patchMarkdownFileInfo();
	}

	onunload() {

	}

	registerCommands() {
		this.addCommand({
		    id: 'split-into-mindmap',
		    name: 'Split into mindmap based on H1',
		    checkCallback: (checking: boolean) => {
		        // Conditions to check
		        const canvasView = app.workspace.getActiveViewOfType(ItemView);
		        if (canvasView?.getViewType() === "canvas") {
		            // If checking is true, we're simply "checking" if the command can be run.
		            // If checking is false, then we want to actually perform the operation.
					const random = (e: number) => {
						let t = [];
						for (let n = 0; n < e; n++) {
							t.push((16 * Math.random() | 0).toString(16));
						}
						return t.join("")
					}

					const createChildFileNode = (canvas: any, parentNode: any, file: TFile, path: string, y: number) => {
						const edge = canvas.edges.get(canvas.getData().edges.first()?.id);
						const tempChildNode = canvas.createFileNode(file, path, {x: parentNode.x + parentNode.width + 200, y: y, height: parentNode.height * 0.6, width: parentNode.width}, true);
						canvas.deselectAll();
						canvas.addNode(tempChildNode);

						const tempEdge = new edge.constructor(canvas, random(16), {side: "right", node: parentNode}, {side: "left", node: tempChildNode})
						canvas.addEdge(tempEdge);

						tempEdge.render();
						canvas.requestSave();

						return tempChildNode;
					}


		            if (!checking) {
						// @ts-ignore
		                const canvas = canvasView?.canvas;
						const currentSelection = canvas?.selection;
						if(currentSelection.size > 1) {
							return;
						}

						const currentSelectionItem = currentSelection.values().next().value;
						if(!currentSelectionItem.filePath) return;

						const currentSelectionItemFile = currentSelectionItem.file as TFile;
						if(!(currentSelectionItemFile.extension === "md")) return;

						const currentFileHeadings = app.metadataCache.getFileCache(currentSelectionItemFile)?.headings;
						if(!currentFileHeadings) return;

						const currentFileHeadingH1 = currentFileHeadings.filter(heading => heading.level === 1);
						if(currentFileHeadingH1.length === 0) return;

						const nodeGroupHeight = (currentSelectionItem.height * 0.6 + 20) * currentFileHeadingH1.length;
						let direction = -1;
						const nodeGroupY = currentSelectionItem.y + currentSelectionItem.height / 2 + (nodeGroupHeight / 2) * direction;

						currentFileHeadingH1.forEach((item, index) => {
							createChildFileNode(canvas, currentSelectionItem, currentSelectionItemFile, "#" + item.heading, nodeGroupY - direction * (currentSelectionItem.height * 0.6 + 20) * index);
						})
		            }
		            return true;
		        }
		    }
		});
	}

	patchCanvas() {
		const random = (e: number) => {
			let t = [];
			for (let n = 0; n < e; n++) {
				t.push((16 * Math.random() | 0).toString(16));
			}
			return t.join("")
		}

		const createNode = (canvas: any, parentNode: any, y: number) => {
			const edge = canvas.edges.get(canvas.getData().edges.first()?.id);
			const tempChildNode = canvas.createTextNode({x: parentNode.x + parentNode.width + 200, y: y}, {height: parentNode.height, width: parentNode.width}, true);
			canvas.deselectAll();
			canvas.addNode(tempChildNode);

			if(edge) {
				const tempEdge = new edge.constructor(canvas, random(16), {side: "right", node: parentNode}, {side: "left", node: tempChildNode})
				canvas.addEdge(tempEdge);

				tempEdge.render();
			}else {
				new Notice("You should have at least one edge in the canvas to use this command.");
			}


			canvas.requestSave();

			return tempChildNode;
		}

		const patchCanvas = () => {
			const canvasView = app.workspace.getLeavesOfType("canvas").first()?.view;
			// @ts-ignore
			const canvas = canvasView?.canvas;
			if (!canvasView) return false;

			const patchCanvasView = canvas.constructor;

			const uninstaller = around(patchCanvasView.prototype, {
				onKeydown: (next) =>
					function (e: any) {
						if(e.key === "Backspace" || e.key === "Delete") {
							if(this.selection.size !== 1)  {
								return next.call(this, e);
							}
							const childNode = this.selection.entries().next().value[1];
							if(childNode.isEditing) return;

							const edges = this.getEdgesForNode(childNode).filter((item: any)=>{
								return item.to.node.id === childNode.id;
							});
							if(edges.length === 0) return;
							const parentNode = edges[0].from.node;


							next.call(this, e);

							let wholeHeight = 0;
							let parentEdges = this.getEdgesForNode(parentNode).filter((item: any)=>{
								return (item.from.node.id === parentNode.id && item.to.side === "left")
							});

							let allnodes = [];
							for(let i = 0; i < parentEdges.length; i++) {
								let node = parentEdges[i].to.node;
								allnodes.push(node);
								wholeHeight += (node.height + 20);
							}
							allnodes.sort((a, b)=>{
								return a.y - b.y;
							});

							// Check if this is a Mindmap
							if(allnodes.length === 1) return;
							if(allnodes.length > 1) {
								if(allnodes[0].x !== allnodes[0].x) {
									return ;
								}
							}

							let preNode;
							for (let i = 0; i < allnodes.length; i++) {
								let tempNode;
								if( i === 0) {
									(tempNode = allnodes[i]).moveTo({
										x: childNode.x,
										y: parentNode.y + parentNode.height - (wholeHeight / 2)
									});
								} else {
									(tempNode = allnodes[i]).moveTo({
										x: childNode.x,
										y: preNode.y + preNode.height + 20
									});
								}
								this.requestSave();
								preNode = tempNode;
							}

							this.requestSave();

							this.selectOnly(parentNode);
							this.zoomToSelection();
							parentNode.startEditing();

							return;
						}
						next.call(this, e);

						if(e.key === "Tab") {
							if(this.selection.size !== 1) return;
							const parentNode = this.selection.entries().next().value[1];

							// Get Previous Node Edges
							let wholeHeight = 0;

							let prevParentEdges = this.getEdgesForNode(parentNode).filter((item: any)=>{
								return (item.from.node.id === parentNode.id && item.to.side === "left")
							});

							let tempChildNode;

							if(prevParentEdges.length === 0) {
								tempChildNode = createNode(this, parentNode, parentNode.y);
							}else{
								let prevAllNodes = [];
								for(let i = 0; i < prevParentEdges?.length; i++) {
									let node = prevParentEdges[i].to.node;
									prevAllNodes.push(node);
								}

								if(prevAllNodes.length > 1) {
									prevAllNodes.sort((a, b) => {
										return a.y - b.y;
									});
								}
								const distanceY = prevAllNodes[prevAllNodes.length - 1 ]?.y + prevAllNodes[prevAllNodes.length - 1 ]?.height + 20;
								tempChildNode = createNode(this, parentNode, distanceY);

								prevAllNodes.push(tempChildNode)
								prevAllNodes.sort((a, b) => {
									return a.y - b.y;
								});

								// Check if this is a Mindmap
								if(prevAllNodes.length === 1) return;

								if(prevAllNodes.length > 1 && prevAllNodes[0].x === prevAllNodes[1]?.x) {
									let preNode;
									wholeHeight = prevAllNodes.length * (parentNode.height + 20);

									for (let i = 0; i < prevAllNodes.length; i++) {
										let tempNode;
										if (i === 0) {
											(tempNode = prevAllNodes[i]).moveTo({
												x: tempChildNode.x,
												y: parentNode.y + parentNode.height / 2 - (wholeHeight / 2)
											});
										} else {
											(tempNode = prevAllNodes[i]).moveTo({
												x: tempChildNode.x,
												y: preNode.y + preNode.height + 20
											});
										}

										this.requestSave();
										preNode = tempNode;
									}
								}
							}

							this.selectOnly(tempChildNode);
							this.zoomToSelection();
							tempChildNode.startEditing();
						}
						if(e.key === "Enter") {
							if(this.selection.size !== 1)  return;
							const childNode = this.selection.entries().next().value[1];
							if(childNode.isEditing) return;

							const edges = this.getEdgesForNode(childNode).filter((item: any)=>{
								return item.to.node.id === childNode.id;
							});
							if(edges.length === 0) return;
							const parentNode = edges[0].from.node;

							const distanceY = childNode.y + childNode.height / 2 + 110;
							const tempChildNode = createNode(this, parentNode, distanceY);

							let wholeHeight = 0;
							let parentEdges = this.getEdgesForNode(parentNode).filter((item: any)=>{
								return (item.from.node.id === parentNode.id && item.to.side === "left")
							});

							let allnodes = [];
							for(let i = 0; i < parentEdges.length; i++) {
								let node = parentEdges[i].to.node;
								allnodes.push(node);
								wholeHeight += (node.height + 20);
							}
							allnodes.sort((a, b)=>{
								return a.y - b.y;
							});

							// Check if this is a Mindmap
							if(allnodes.length === 1) return;
							if(allnodes.length > 1 && allnodes[0].x === allnodes[1]?.x) {
								let preNode;
								for (let i = 0; i < allnodes.length; i++) {
									let tempNode;
									if( i === 0) {
										(tempNode = allnodes[i]).moveTo({
											x: childNode.x,
											y: parentNode.y + parentNode.height / 2 - (wholeHeight / 2)
										});
									} else {
										(tempNode = allnodes[i]).moveTo({
											x: childNode.x,
											y: preNode.y + preNode.height + 20
										});
									}
									this.requestSave();
									preNode = tempNode;
								}
							}

							this.requestSave();

							this.selectOnly(tempChildNode);
							this.zoomToSelection();
							tempChildNode.startEditing();
						}

					},
			});
			this.register(uninstaller);

			canvas?.view.leaf.rebuildView();
			console.log("Obsidian-Canvas-MindMap: canvas view patched");
			return true;
		}

		this.app.workspace.onLayoutReady(() => {
			if (!patchCanvas()) {
				const evt = app.workspace.on("layout-change", () => {
					patchCanvas() && app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	patchMarkdownFileInfo() {
		const patchEditor = () => {
			const editorInfo = app.workspace.activeEditor;
			if(!editorInfo) return false;

			const patchEditorInfo = editorInfo.constructor;
			console.log(app.workspace.activeEditor);

			const uninstaller = around(patchEditorInfo.prototype, {
				showPreview: (next) =>
					function (e: any) {
						next.call(this, e);
						if(e) {
							this.node.canvas.wrapperEl.focus();
							this.node.setIsEditing(false);
						}
					},
			});
			this.register(uninstaller);

			console.log("Obsidian-Canvas-MindMap: markdown file info patched");
			return true;
		}

		this.app.workspace.onLayoutReady(() => {
			if (!patchEditor()) {
				const evt = app.workspace.on("file-open", () => {
					setTimeout(()=>{
						patchEditor() && app.workspace.offref(evt);
					}, 100);
				});
				this.registerEvent(evt);
			}
		});
	}
}
