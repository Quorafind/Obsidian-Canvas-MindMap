import { ItemView, MarkdownFileInfo, Notice, Plugin, requireApiVersion, TFile } from 'obsidian';
import { around } from "monkey-around";
import { addEdge, createChildFileNode, random } from "./utils";

export default class CanvasMindMap extends Plugin {

	async onload() {
		this.registerCommands();
		this.patchCanvas();
		this.patchMarkdownFileInfo();
		this.patchCanvasNode();
	}

	onunload() {

	}

	registerCommands() {
		this.addCommand({
		    id: 'split-heading-into-mindmap',
		    name: 'Split Heading into mindmap based on H1',
		    checkCallback: (checking: boolean) => {
		        // Conditions to check
		        const canvasView = app.workspace.getActiveViewOfType(ItemView);
		        if (canvasView?.getViewType() === "canvas") {
		            // If checking is true, we're simply "checking" if the command can be run.
		            // If checking is false, then we want to actually perform the operation.

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
		const createEdge = async (node1: any, node2: any, canvas: any)=> {
			if(requireApiVersion("1.1.9")) {
				addEdge(canvas, random(16), {
					fromOrTo: "from",
					side: "right",
					node: node1
				},{
					fromOrTo: "to",
					side: "left",
					node: node2
				})
			} else {

				// Leave code here to prevent error when Obsidian version is lower than 1.1.9??
				const edge = canvas.edges.get(canvas.getData().edges.first()?.id);

				if (edge) {
					const tempEdge = new edge.constructor(canvas, random(16), {
						side: "right",
						node: node1
					}, { side: "left", node: node2 })
					canvas.addEdge(tempEdge);

					tempEdge.render();


				} else {
					setTimeout(async () => {
						const canvasFile = await this.app.vault.cachedRead(canvas.view.file);
						const canvasFileData = JSON.parse(canvasFile);

						canvasFileData.edges.push({
							id: random(16),
							fromNode: node1.id,
							fromSide: "right",
							toNode: node2.id,
							toSide: "left"
						});
						canvasFileData.nodes.push({
							id: node2.id,
							x: node2.x,
							y: node2.y,
							width: node2.width,
							height: node2.height,
							type: "text",
							text: node2.text,
						})

						canvas.setData(canvasFileData);
						canvas.requestSave();
					}, 500);
				}
			}
		}

		const navigate = (canvas: any, direction: string) => {
			const currentSelection = canvas.selection;
			if(currentSelection.size !== 1) return;

			const currentSelectionItem = currentSelection.values().next().value;

			const currentViewPortNodes = canvas.getViewportNodes();
			const x = currentSelectionItem.x;
			const y = currentSelectionItem.y;

			canvas.deselectAll();

			let nextNode = null;
			if(direction === "top") {
				let nodeArray = currentViewPortNodes.filter((item: any) => item.y < y).filter((item: any) => (item.x  < x + currentSelectionItem.width / 2 && item.x + item.width > x + currentSelectionItem.width / 2));
				if(nodeArray.length === 0) {
					nextNode = currentViewPortNodes.filter((node: any) => node.y < y).sort((a: any, b: any) => b.y - a.y).sort((a: any, b: any) => a.x - b.x)[0];
				}else {
					nextNode = nodeArray?.sort((a: any, b: any) => b.y - a.y)[0];
				}
			} else if(direction === "bottom") {
				let nodeArray = currentViewPortNodes.filter((item: any) => item.y > y).filter((item: any) => (item.x  < x + currentSelectionItem.width / 2 && item.x + item.width > x + currentSelectionItem.width / 2));
				if(nodeArray.length === 0) {
					nextNode = currentViewPortNodes.filter((node: any) => node.y > y).sort((a: any, b: any) => a.y - b.y).sort((a: any, b: any) => a.x - b.x )[0];
				}else {
					nextNode = nodeArray?.sort((a: any, b: any) => a.y - b.y)[0];
				}
			} else if(direction === "left") {
				let nodeArray = currentViewPortNodes.filter((item: any) => item.x < x).filter((item: any) => (item.y  < y + currentSelectionItem.height / 2 && item.y + item.height > y + currentSelectionItem.height / 2));
				if(nodeArray.length === 0) {
					nextNode = currentViewPortNodes.filter((node: any) => node.x < x).sort((a: any, b: any) => b.x - a.x).sort((a: any, b: any) => a.y - b.y)[0];
				}else {
					nextNode = nodeArray?.sort((a: any, b: any) => b.x - a.x)[0];
				}
			} else if (direction === "right") {
				let nodeArray = currentViewPortNodes.filter((item: any) => item.x > x).filter((item: any) => (item.y  < y + currentSelectionItem.height / 2 && item.y + item.height > y + currentSelectionItem.height / 2));
				if(nodeArray.length === 0) {
					nextNode = currentViewPortNodes.filter((node: any) => node.x > x).sort((a: any, b: any) => a.x - b.x).sort((a: any, b: any) => a.y - b.y)[0];
				}else{
					nextNode = nodeArray?.sort((a: any, b: any) => a.x - b.x)[0];
				}
			}

			if(nextNode) {
				canvas.selectOnly(nextNode);
				canvas.zoomToSelection();
			}

			return nextNode;
		}

		const createSperateNode = (canvas: any, direction: string) => {
			let selection = canvas.selection;
			if(selection.size !== 1) return;

			let node = selection.values().next().value;
			let x = direction === "left" ? node.x - node.width - 50 : direction === "right" ? node.x + node.width + 50 : node.x;
			let y = direction === "top" ? node.y - node.height - 100 : direction === "bottom" ? node.y + node.height + 100 : node.y;

			if(requireApiVersion("1.1.10")) {
				const tempChildNode = canvas.createTextNode({
					pos: {
						x: x,
						y: y,
						height: node.height,
						width: node.width
					},
					size: {
						x: x,
						y: y,
						height: node.height,
						width: node.width
					},
					text: "",
					focus: true,
					save: true,
				});

				canvas.zoomToSelection();

				return tempChildNode;
			} else {
				const tempChildNode = canvas.createTextNode({
					x: x,
					y: y
				}, { height: node.height, width: node.width }, true);

				canvas.zoomToSelection();

				return tempChildNode;
			}
		}

		const createNode = async (canvas: any, parentNode: any, y: number) => {
			let tempChildNode;
			if(!requireApiVersion("1.1.10")) {
				tempChildNode = canvas.createTextNode({
					x: parentNode.x + parentNode.width + 200,
					y: y
				}, { height: parentNode.height, width: parentNode.width }, true);
			} else {
				tempChildNode = canvas.createTextNode({
					pos: {
						x: parentNode.x + parentNode.width + 200,
						y: y,
						height: parentNode.height,
						width: parentNode.width
					},
					size: {
						x: parentNode.x + parentNode.width + 200,
						y: y,
						height: parentNode.height,
						width: parentNode.width
					},
					text: "",
					focus: false,
					save: true,
				});
			}
			canvas.deselectAll();
			canvas.addNode(tempChildNode);

			await createEdge(parentNode, tempChildNode, canvas);

			canvas.requestSave();

			return tempChildNode;
		}

		const startEditing = (canvas: any) => {
			if(!canvas) return;

			const selection = canvas.selection;
			if(selection.size !== 1) return;
			const node = selection.entries().next().value[1];

			if(node.isEditing) return;
			node.startEditing();
		}

		const createChildNode = async (canvas: any) => {
			if (canvas.selection.size !== 1) return;
			const parentNode = canvas.selection.entries().next().value[1];

			// Get Previous Node Edges
			let wholeHeight = 0;

			let prevParentEdges = canvas.getEdgesForNode(parentNode).filter((item: any) => {
				return (item.from.node.id === parentNode.id && item.to.side === "left")
			});

			let tempChildNode;

			if (prevParentEdges.length === 0) {
				tempChildNode = await createNode(canvas, parentNode, parentNode.y);
			} else {
				let prevAllNodes = [];
				for (let i = 0; i < prevParentEdges?.length; i++) {
					let node = prevParentEdges[i].to.node;
					prevAllNodes.push(node);
				}

				if (prevAllNodes.length > 1) {
					prevAllNodes.sort((a: any, b: any) => {
						return a.y - b.y;
					});
				}
				const distanceY = prevAllNodes[prevAllNodes.length - 1]?.y + prevAllNodes[prevAllNodes.length - 1]?.height + 20;
				tempChildNode = await createNode(canvas, parentNode, distanceY);

				prevAllNodes.push(tempChildNode)
				prevAllNodes.sort((a: any, b: any) => {
					return a.y - b.y;
				});

				// Check if this is a Mindmap
				if (prevAllNodes.length === 1) return;

				if (prevAllNodes.length > 1 && prevAllNodes[0].x === prevAllNodes[1]?.x) {
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

						canvas.requestSave();
						preNode = tempNode;
					}
				}
			}

			return tempChildNode;

		}

		const createSiblingNode = async (canvas: any) => {
			if (canvas.selection.size !== 1) return;
			const childNode = canvas.selection.entries().next().value[1];

			if (childNode.isEditing) return;

			const edges = canvas.getEdgesForNode(childNode).filter((item: any) => {
				return item.to.node.id === childNode.id;
			});
			if (edges.length === 0) return;
			const parentNode = edges[0].from.node;

			const distanceY = childNode.y + childNode.height / 2 + 110;
			const tempChildNode = await createNode(canvas, parentNode, distanceY);

			let wholeHeight = 0;
			let parentEdges = canvas.getEdgesForNode(parentNode).filter((item: any) => {
				return (item.from.node.id === parentNode.id && item.to.side === "left")
			});

			let allnodes = [];
			for (let i = 0; i < parentEdges.length; i++) {
				let node = parentEdges[i].to.node;
				allnodes.push(node);
				wholeHeight += (node.height + 20);
			}
			allnodes.sort((a: any, b: any) => {
				return a.y - b.y;
			});

			// Check if this is a Mindmap
			if (allnodes.length === 1) return;
			if (allnodes.length > 1 && allnodes[0].x === allnodes[1]?.x) {
				let preNode;
				for (let i = 0; i < allnodes.length; i++) {
					let tempNode;
					if (i === 0) {
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
					preNode = tempNode;
				}
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

			const canvasViewunistaller = around(canvasView.constructor.prototype, {
				onOpen: (next) =>
					async function () {
						this.scope.register(["Mod"], "ArrowUp", () => {
							createSperateNode(this.canvas, "top");
						})
						this.scope.register(["Mod"], "ArrowDown", () => {
							createSperateNode(this.canvas, "bottom");
						});
						this.scope.register(["Mod"], "ArrowLeft", () => {
							createSperateNode(this.canvas, "left");
						});
						this.scope.register(["Mod"], "ArrowRight", () => {
							createSperateNode(this.canvas, "right");
						});

						this.scope.register(["Alt"], "ArrowUp", () => {
							navigate(this.canvas, "top");
						})
						this.scope.register(["Alt"], "ArrowDown", () => {
							navigate(this.canvas, "bottom");
						});
						this.scope.register(["Alt"], "ArrowLeft", () => {
							navigate(this.canvas, "left");
						});
						this.scope.register(["Alt"], "ArrowRight", () => {
							navigate(this.canvas, "right");
						});

						this.scope.register([], "Enter", async () => {


							const node = await createSiblingNode(this.canvas);
							console.log(node);
							if(!node) return;

							setTimeout(() => {
								node.startEditing();
								this.canvas.zoomToSelection();
							}, 0)
						});

						this.scope.register([], "Tab", async () => {
							const node = await createChildNode(this.canvas);

							if(!node) return;

							setTimeout(() => {
								node.startEditing();
								this.canvas.zoomToSelection();
							}, 0)
						});
						return next.call(this)
					}
			})

			const uninstaller = around(patchCanvasView.prototype, {
				onKeydown: (next) =>
					async function (e: any) {
						if (e.key === "Backspace" || e.key === "Delete") {
							if (this.selection.size !== 1) {
								return next.call(this, e);
							}
							const childNode = this.selection.entries().next().value[1];
							if (childNode.isEditing) return;

							const edges = this.getEdgesForNode(childNode).filter((item: any) => {
								return item.to.node.id === childNode.id;
							});
							if (edges.length === 0) return;
							const parentNode = edges[0].from.node;


							next.call(this, e);

							let wholeHeight = 0;
							let parentEdges = this.getEdgesForNode(parentNode).filter((item: any) => {
								return (item.from.node.id === parentNode.id && item.to.side === "left")
							});

							let allnodes = [];
							for (let i = 0; i < parentEdges.length; i++) {
								let node = parentEdges[i].to.node;
								allnodes.push(node);
								wholeHeight += (node.height + 20);
							}
							allnodes.sort((a: any, b: any) => {
								return a.y - b.y;
							});

							// Check if this is a Mindmap
							if (allnodes.length === 1) return;
							if (allnodes.length > 1) {
								if (allnodes[0].x !== allnodes[0].x) {
									return;
								}
							}

							let preNode;
							for (let i = 0; i < allnodes.length; i++) {
								let tempNode;
								if (i === 0) {
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

						if (e.key === " ") {
							const selection = this.selection;
							if(selection.size !== 1) return;
							const node = selection.entries().next().value[1];

							if(node?.label || node?.url) return ;

							if(node.isEditing) return;
							node.startEditing();
						}

						next.call(this, e);
					},
			});
			this.register(uninstaller);
			this.register(canvasViewunistaller);

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

	patchCanvasNode() {
		const patchNode = () => {
			const canvasView = app.workspace.getLeavesOfType("canvas").first()?.view;
			// @ts-ignore
			const canvas = canvasView?.canvas;
			if(!canvas) return false;

			const node = Array.from(canvas.nodes).first();
			if (!node) return false;

			// @ts-ignore
			const nodeInstance = node[1];

			const uninstaller = around(nodeInstance.constructor.prototype, {
				setColor: (next: any) =>
					function (e: any, t: any) {
						next.call(this, e, t);
						this.canvas.getEdgesForNode(this).forEach((edge: any) => {
							if(edge.from.node === this) {
								edge.setColor(e, true);
								edge.render();
								// edge.to.node.setColor(e, true);
							}
						})
						canvas.requestSave();
					},
			});
			this.register(uninstaller);

			console.log("Obsidian-Canvas-MindMap: canvas node patched");
			return true;
		}

		this.app.workspace.onLayoutReady(() => {
			if (!patchNode()) {
				const evt = app.workspace.on("layout-change", () => {
					patchNode() && app.workspace.offref(evt);
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

			const uninstaller = around(patchEditorInfo.prototype, {
				showPreview: (next) =>
					function (e: any) {
						next.call(this, e);
						if(e) {
							this.node.canvas.wrapperEl.focus();
							this.node?.setIsEditing(false);
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
