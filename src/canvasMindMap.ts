import { Canvas, CanvasEdge, CanvasNode, ItemView, Plugin, requireApiVersion, SettingTab, TFile } from 'obsidian';
import { around } from "monkey-around";
import { addEdge, addNode, buildTrees, createChildFileNode, random } from "./utils";
import { DEFAULT_SETTINGS, MindMapSettings } from "./mindMapSettings";
import { CanvasEdgeData } from "obsidian/canvas";


export default class CanvasMindMap extends Plugin {
	settings: MindMapSettings;


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
						if (currentSelection.size > 1) {
							return;
						}

						const currentSelectionItem = currentSelection.values().next().value;
						if (!currentSelectionItem.filePath) return;

						const currentSelectionItemFile = currentSelectionItem.file as TFile;
						if (!(currentSelectionItemFile.extension === "md")) return;

						const currentFileHeadings = app.metadataCache.getFileCache(currentSelectionItemFile)?.headings;
						if (!currentFileHeadings) return;

						const currentFileHeadingH1 = currentFileHeadings.filter(heading => heading.level === 1);
						if (currentFileHeadingH1.length === 0) return;

						const nodeGroupHeight = (currentSelectionItem.height * 0.6 + 20) * currentFileHeadingH1.length;
						let direction = -1;
						const nodeGroupY = currentSelectionItem.y + currentSelectionItem.height / 2 + (nodeGroupHeight / 2) * direction;

						currentFileHeadingH1.forEach((item, index) => {
							createChildFileNode(canvas, currentSelectionItem, currentSelectionItemFile, "#" + item.heading, nodeGroupY - direction * (currentSelectionItem.height * 0.6 + 20) * index);
						});
					}
					return true;
				}
			}
		});

		this.addCommand({
			id: 'create-floating-node',
			name: 'Create floating node',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const canvasView = app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() === "canvas") {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						// @ts-ignore
						const canvas = canvasView?.canvas;

						const node = canvas.createTextNode({
							pos: {
								x: 0,
								y: 0,
								height: 500,
								width: 400
							},
							size: {
								x: 0,
								y: 0,
								height: 500,
								width: 400
							},
							text: "",
							focus: true,
							save: true,
						});

						canvas.addNode(node);
						canvas.requestSave();
						if (!node) return;

						setTimeout(() => {
							node.startEditing();
							canvas.zoomToSelection();
						}, 0);
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
	}

	patchCanvas() {
		const createEdge = async (node1: any, node2: any, canvas: any) => {

			addEdge(canvas, random(16), {
				fromOrTo: "from",
				side: "right",
				node: node1
			}, {
				fromOrTo: "to",
				side: "left",
				node: node2
			});

		};

		const navigate = (canvas: Canvas, direction: string) => {
			const currentSelection = canvas.selection;
			if (currentSelection.size !== 1) return;

			const selectedItem = currentSelection.values().next().value as CanvasNode;
			const viewportNodes = canvas.getViewportNodes();
			const {x, y, width, height} = selectedItem;

			canvas.deselectAll();

			const isVertical = direction === "top" || direction === "bottom";
			const comparePrimary = isVertical ? (a: CanvasNode, b: CanvasNode) => a.y - b.y : (a: CanvasNode, b: CanvasNode) => a.x - b.x;
			const compareSecondary = isVertical ? (a: CanvasNode, b: CanvasNode) => a.x - b.x : (a: CanvasNode, b: CanvasNode) => a.y - b.y;
			const filterCondition = (node: CanvasNode) => {
				const inRange = isVertical
					? node.x < x + width / 2 && node.x + node.width > x + width / 2
					: node.y < y + height / 2 && node.y + node.height > y + height / 2;
				const directionCondition = direction === "top" ? node.y < y : direction === "bottom" ? node.y > y : direction === "left" ? node.x < x : node.x > x;
				return inRange && directionCondition;
			};

			const filteredNodes = viewportNodes.filter(filterCondition);
			const sortedNodes = filteredNodes.length > 0 ? filteredNodes.sort(comparePrimary) : viewportNodes.filter((node: CanvasNode) => direction === "top" ? node.y < y : direction === "bottom" ? node.y > y : direction === "left" ? node.x < x : node.x > x).sort(compareSecondary);
			const nextNode = sortedNodes[0];

			if (nextNode) {
				canvas.selectOnly(nextNode);
				canvas.zoomToSelection();
			}

			return nextNode;
		};

		const createFloatingNode = (canvas: any, direction: string) => {
			let selection = canvas.selection;

			if (selection.size !== 1) return;

			let node = selection.values().next().value;
			let x = direction === "left" ? node.x - node.width - 50 : direction === "right" ? node.x + node.width + 50 : node.x;
			let y = direction === "top" ? node.y - node.height - 100 : direction === "bottom" ? node.y + node.height + 100 : node.y;


			const tempChildNode = addNode(
				canvas, random(16), {
					x: x,
					y: y,
					width: node.width,
					height: node.height,
					type: 'text',
					content: "",
				}
			);

			canvas?.requestSave();

			const currentNode = canvas.nodes?.get(tempChildNode?.id!);
			if (!currentNode) return;
			canvas.selectOnly(currentNode);
			canvas.zoomToSelection();

			return tempChildNode;
		};

		const childNode = async (canvas: Canvas, parentNode: any, y: number) => {
			let tempChildNode = addNode(
				canvas, random(16), {
					x: parentNode.x + parentNode.width + 200,
					y: y,
					width: parentNode.width,
					height: parentNode.height,
					type: 'text',
					content: "",
				}
			);
			await createEdge(parentNode, tempChildNode, canvas);

			canvas.deselectAll();
			const node = canvas.nodes?.get(tempChildNode?.id!);
			if (!node) return;
			canvas.selectOnly(node);

			canvas.requestSave();

			return tempChildNode;
		};

		const createChildNode = async (canvas: Canvas) => {
			if (canvas.selection.size !== 1) return;
			const parentNode = canvas.selection.entries().next().value[1];

			if (parentNode.isEditing) return;

			// Calculate the height of all the children nodes
			let wholeHeight = 0;
			let tempChildNode;
			const canvasData = canvas.getData();

			const prevParentEdges = canvasData.edges.filter((item: CanvasEdgeData) => {
				return (item.fromNode === parentNode.id && item.toSide === "left");
			});

			if (prevParentEdges.length === 0) {
				tempChildNode = await childNode(canvas, parentNode, parentNode.y);
			} else {
				// const prevAllNodes = [];
				// for (let i = 0; i < prevParentEdges?.length; i++) {
				//     let node = prevParentEdges[i].toNode;
				//     prevAllNodes.push(node);
				// }
				//
				// if (prevAllNodes.length > 1) {
				//     prevAllNodes.sort((a: any, b: any) => {
				//         return a.y - b.y;
				//     });
				// }
				// const distanceY = prevAllNodes[prevAllNodes.length - 1]?.y + prevAllNodes[prevAllNodes.length - 1]?.height + 20;
				// tempChildNode = await childNode(canvas, parentNode, distanceY);
				//
				// prevAllNodes.push(tempChildNode);
				// prevAllNodes.sort((a: any, b: any) => {
				//     return a.y - b.y;
				// });
				//
				// // Check if this is a Mindmap
				// if (prevAllNodes.length === 1) return;
				//
				// if (prevAllNodes.length > 1 && prevAllNodes[0].x === prevAllNodes[1]?.x) {
				//     let preNode;
				//     wholeHeight = prevAllNodes.length * (parentNode.height + 20);
				//
				//     for (let i = 0; i < prevAllNodes.length; i++) {
				//         let tempNode;
				//         if (i === 0) {
				//             (tempNode = prevAllNodes[i]).moveTo({
				//                 x: tempChildNode.x,
				//                 y: parentNode.y + parentNode.height / 2 - (wholeHeight / 2)
				//             });
				//         } else {
				//             (tempNode = prevAllNodes[i]).moveTo({
				//                 x: tempChildNode.x,
				//                 y: preNode.y + preNode.height + 20
				//             });
				//         }
				//
				//         canvas.requestSave();
				//         preNode = tempNode;
				//     }
				// }
			}

			return tempChildNode;

		};

		const createSiblingNode = async (canvas: Canvas) => {
			if (canvas.selection.size !== 1) return;
			const selectedNode = canvas.selection.entries().next().value[1];

			if (selectedNode.isEditing) return;

			const incomingEdges = canvas.getEdgesForNode(selectedNode).filter((edge: CanvasEdge) => edge.to.node.id === selectedNode.id);
			if (incomingEdges.length === 0) return;
			const parentNode = incomingEdges[0].from.node;

			const newYPosition = selectedNode.y + selectedNode.height / 2 + 110;
			const newChildNode = await childNode(canvas, parentNode, newYPosition);

			const leftSideEdges = canvas.getEdgesForNode(parentNode).filter((edge: CanvasEdge) => edge.from.node.id === parentNode.id && edge.to.side === "left");

			let nodes = leftSideEdges.map((edge: CanvasEdge) => edge.to.node);
			let totalHeight = nodes.reduce((acc: number, node: CanvasNode) => acc + node.height + 20, 0);

			nodes.sort((a, b) => a.y - b.y);

			if (nodes.length <= 1) return;
			if (nodes.length > 1 && nodes[0].x === nodes[1]?.x) {
				nodes.forEach((node: CanvasNode, index: number) => {
					const yPos = index === 0 ? parentNode.y + parentNode.height / 2 - totalHeight / 2 : nodes[index - 1].y + nodes[index - 1].height + 20;
					node.moveTo({x: selectedNode.x, y: yPos});
				});
			}

			canvas.requestSave();
			return newChildNode;
		};


		const patchCanvas = () => {
			const canvasView = app.workspace.getLeavesOfType("canvas").first()?.view;
			// @ts-ignore
			const canvas = canvasView?.canvas;
			if (!canvasView) return false;

			const patchCanvasView = canvas.constructor;

			console.log("patchCanvasView", patchCanvasView);

			const canvasViewunistaller = around(canvasView.constructor.prototype, {
				onOpen: (next) =>
					async function () {
						this.scope.register(["Mod"], "ArrowUp", () => {
							createFloatingNode(this.canvas, "top");
						});
						this.scope.register(["Mod"], "ArrowDown", () => {
							createFloatingNode(this.canvas, "bottom");
						});
						this.scope.register(["Mod"], "ArrowLeft", () => {
							createFloatingNode(this.canvas, "left");
						});
						this.scope.register(["Mod"], "ArrowRight", () => {
							createFloatingNode(this.canvas, "right");
						});

						this.scope.register(["Alt"], "ArrowUp", () => {
							navigate(this.canvas, "top");
						});
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

							if (!node) return;

							setTimeout(() => {
								node.startEditing();
								this.canvas.zoomToSelection();
							}, 0);
						});

						this.scope.register([], "Tab", async () => {
							const node = await createChildNode(this.canvas);

							if (!node) return;

							setTimeout(() => {
								node.startEditing();
								this.canvas.zoomToSelection();
							}, 0);
						});
						return next.call(this);
					}
			});

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
								return (item.from.node.id === parentNode.id && item.to.side === "left");
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
							if (selection.size !== 1) return;
							const node = selection.entries().next().value[1];

							if (node?.label || node?.url) return;

							if (node.isEditing) return;
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
		};

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
			if (!canvas) return false;

			const node = Array.from(canvas.nodes).first();
			if (!node) return false;

			// @ts-ignore
			const nodeInstance = node[1];

			const uninstaller = around(nodeInstance.constructor.prototype, {
				setColor: (next: any) =>
					function (e: any, t: any) {
						next.call(this, e, t);
						this.canvas.getEdgesForNode(this).forEach((edge: any) => {
							if (edge.from.node === this) {
								edge.setColor(e, true);
								edge.render();
								// edge.to.node.setColor(e, true);
							}
						});
						canvas.requestSave();
					},
			});
			this.register(uninstaller);

			console.log("Obsidian-Canvas-MindMap: canvas node patched");
			return true;
		};

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
			if (!editorInfo) return false;

			const patchEditorInfo = editorInfo.constructor;

			const uninstaller = around(patchEditorInfo.prototype, {
				showPreview: (next) =>
					function (e: any) {
						next.call(this, e);
						if (e) {
							this.node?.canvas.wrapperEl.focus();
							this.node?.setIsEditing(false);
						}
					},
			});
			this.register(uninstaller);

			console.log("Obsidian-Canvas-MindMap: markdown file info patched");
			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchEditor()) {
				const evt = app.workspace.on("file-open", () => {
					setTimeout(() => {
						patchEditor() && app.workspace.offref(evt);
					}, 100);
				});
				this.registerEvent(evt);
			}
		});
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
