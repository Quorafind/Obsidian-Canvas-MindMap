import 'obsidian';
import { MarkdownView, TFile } from 'obsidian';
import { CanvasData } from 'obsidian/canvas';

export interface CanvasNodeUnknownData {
    id: string;
    collapsed: boolean;

    [key: string]: any;
}

declare module 'obsidian' {
    type CanvasNodeID = string;
    type CanvasEdgeID = string;

    interface App {
        appId: string;
        plugins: {
            getPlugin(name: string): any;
        };
        commands: any;
    }

    interface View {
        contentEl: HTMLElement;

        file: TFile;
    }

    interface CanvasView extends View {
        canvas: Canvas;
        file: TFile;
    }

    interface Canvas {
        readonly: boolean;
        view: MarkdownView;
        x: number;
        y: number;
        nodes: Map<CanvasNodeID, CanvasNode>;
        edges: Map<string, CanvasEdge>;
        nodeInteractionLayer: CanvasInteractionLayer;
        selection: Set<CanvasNode>;

        menu: CanvasMenu;

        wrapperEl: HTMLElement;

        history: any;
        requestPushHistory: any;
        nodeIndex: any;

        importData(data: CanvasData): void;

        requestSave(save?: boolean, triggerBySelf?: boolean): void;

        getData(): CanvasData;

        setData(data: CanvasData): void;

        getEdgesForNode(node: CanvasNode): CanvasEdge[];

        getContainingNodes(coords: CanvasCoords): CanvasNode[];

        deselectAll(): void;

        select(nodes: CanvasNode): void;

        requestFrame(): void;

        getViewportNodes(): CanvasNode[];

        selectOnly(nodes: CanvasNode): void;

        requestSave(save?: boolean, triggerBySelf?: boolean): void;

        zoomToSelection(): void;
    }

    interface ICanvasData {
        nodes: CanvasNode[];
        edges: CanvasEdge[];
    }

    interface CanvasMenu {
        containerEl: HTMLElement;
        menuEl: HTMLElement;
        canvas: Canvas;
        selection: CanvasSelection;

        render(): void;

        updateZIndex(): void;
    }

    interface CanvasSelection {
        selectionEl: HTMLElement;
        resizerEls: HTMLElement;
        canvas: Canvas;
        bbox: CanvasCoords | undefined;

        render(): void;

        hide(): void;

        onResizePointerDown(e: PointerEvent, direction: CanvasDirection): void;

        update(bbox: CanvasCoords): void;
    }

    interface CanvasInteractionLayer {
        interactionEl: HTMLElement;
        canvas: Canvas;
        target: CanvasNode | null;

        render(): void;

        setTarget(target: CanvasNode | null): void;
    }

    interface CanvasNode {
        id: CanvasNodeID;

        x: number;
        y: number;
        width: number;
        height: number;
        zIndex: number;
        bbox: CanvasCoords;
        unknownData: CanvasNodeUnknownData;
        renderedZIndex: number;

        headerComponent: Component;

        nodeEl: HTMLElement;
        labelEl: HTMLElement;
        contentEl: HTMLElement;
        containerEl: HTMLElement;

        canvas: Canvas;
        app: App;

        getBBox(containing?: boolean): CanvasCoords;

        moveTo({x, y}: { x: number, y: number }): void;

        render(): void;
    }

    interface CanvasTextNode extends CanvasNode {
        text: string;
        child: any;
    }

    interface CanvasFileNode extends CanvasNode {
        file: TFile;
    }

    interface CanvasLinkNode extends CanvasNode {
        url: string;
    }

    interface CanvasGroupNode extends CanvasNode {
        label: string;
    }

    interface CanvasEdge {
        id: CanvasEdgeID;

        label: string | undefined;
        lineStartGroupEl: SVGGElement;
        lineEndGroupEl: SVGGElement;
        lineGroupEl: SVGGElement;

        path: {
            display: SVGPathElement;
            interaction: SVGPathElement;
        };

        from: {
            node: CanvasNode;
        };

        to: {
            side: 'left' | 'right' | 'top' | 'bottom';
            node: CanvasNode;
        };

        canvas: Canvas;
        bbox: CanvasCoords;

        unknownData: CanvasNodeUnknownData;
    }

    interface CanvasCoords {
        maxX: number;
        maxY: number;
        minX: number;
        minY: number;
    }
}
