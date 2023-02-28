import { ascending, min, sum } from 'd3-array';
import { nest } from 'd3-collection';
import { interpolateNumber } from 'd3-interpolate';
import { ChartMargins, ChartRect } from '../charts-common';
import { EdgeDef, LabelAlignment, NodeDef, NodeLevelParams, SankeyGraph } from './d3-sankey-chart';
import { D3SankeyChartOptions } from './d3-sankey-chart-options';
import { DirectedGraph } from '../common/collections/directed-graph';

const DEFAULT_LEVEL_PARAMS: NodeLevelParams = {
  // title: null,
  // labelAlign: null,
  nodeLabelAlign: 'left',
  // stickTo: null,
  stickPadding: 80
};

// TODO: document classes

/**
 * Represents sankey chart node with all extra parameters used for rendering (coordinates, sized, etc).
 */
export class SankeyNode {
  // Original data reference
  readonly data: NodeDef;

  x = 0;
  y = 0;
  width = 0;

  depth = 0;
  title = '';

  constructor(data: NodeDef, private layout: D3SankeyChartLayout, private graph: SankeyGraph) {
    this.data = data;
    this.title = data.title ?? '';
  }

  get value(): number {
    const incomingSum = sum(this.graph.getIncomingEdgesOf(this), (edge: SankeyEdge) => edge.value);
    const outgoingSum = sum(this.graph.getOutgoingEdgesOf(this), (edge: SankeyEdge) => edge.value);

    return Math.max(incomingSum, outgoingSum);
  }

  get displayValue(): number {
    const incomingSum = sum(this.graph.getIncomingEdgesOf(this), (edge: SankeyEdge) => edge.displayValue);
    const outgoingSum = sum(this.graph.getOutgoingEdgesOf(this), (edge: SankeyEdge) => edge.displayValue);

    return Math.max(incomingSum, outgoingSum);
  }

  get centerY(): number {
    return this.y + this.breadth / 2;
  }

  get breadth(): number {
    return this.displayValue * this.layout.scale;
  }

  get y2(): number {
    return this.y + this.breadth;
  }
}

export class SankeyEdge {
  readonly data: EdgeDef;

  value: number;

  // Offset of the edge from the top of source node.
  sourceYOffset = 0;

  // Offset of the edge from the top of target node.
  targetYOffset = 0;

  constructor(edge: EdgeDef, private layout: D3SankeyChartLayout) {
    this.value = edge.value;
    this.data = edge;
  }

  get displayValue(): number {
    return Math.max(this.value, this.layout.minDisplayValue);
  }

  get breadth(): number {
    return this.displayValue * this.layout.scale;
  }
}

export interface LevelLabelItem {
  x: number;
  index: number;
  textAlign: LabelAlignment;
}

export function getTextAnchor(alignment: LabelAlignment): string {
  switch (alignment) {
    case 'right':
      return 'end';

    case 'middle':
      return 'middle';

    default:
      return 'start';
  }
}

/**
 * Layout class contains all calculated values required to properly position chart elements on the screen.
 */
export class D3SankeyChartLayout {

  // Config properties
  labelPadding = 12;
  levelGap: number;
  private readonly plotAreaMargins: ChartMargins;

  // Calculated properties
  readonly nodes: SankeyNode[];
  readonly edges: SankeyEdge[];
  readonly levelLabels: LevelLabelItem[];
  readonly plotArea: ChartRect;
  readonly legendArea: ChartRect;

  private readonly graphDiameter: number;

  // Calculated node gap for cases when there are to many nodes on one level, so they will "eat" all the space.
  // In this cases gap is decreased to some smaller value, so we can give nodes more space.
  private readonly minNodeGap: number | null = null;

  readonly graph: SankeyGraph;

  // Scale factor that's used to convert data value to screen coordinates
  scale = 1;

  minDisplayValue = 0;

  constructor(
    public readonly width: number,
    public readonly height: number,
    private nodeDefs: NodeDef[],
    private edgeDefs: EdgeDef[],
    public readonly options: D3SankeyChartOptions = {}
  ) {
    this.graph = new DirectedGraph<SankeyNode, SankeyEdge>();
    const nodeMap: Map<string | number, SankeyNode> = new Map<string | number, SankeyNode>();

    nodeDefs.forEach((nodeDef) => {
      const node: SankeyNode = new SankeyNode(nodeDef, this, this.graph);

      nodeMap.set(nodeDef.id, node);
      // this.nodesMap.set(nodeDef, node);

      this.graph.addNode(node);
    });

    edgeDefs.forEach((edgeDef) => {
      // TODO: [VGren] Replace non-null assertions
      const sourceNodeParams = nodeMap.get(edgeDef.sourceNodeId)!;
      const targetNodeParams = nodeMap.get(edgeDef.targetNodeId)!;
      const edge: SankeyEdge = new SankeyEdge(edgeDef, this);

      // this.edgesMap.set(edgeDef, edge);
      this.graph.addEdge(sourceNodeParams, targetNodeParams, edge);
    });


    const legendHeight = 30;

    const margins = new ChartMargins(options.margins || {
      top: 30,
      left: 60,
      right: 60,
      bottom: this.options.legend ? legendHeight : 0
    });

    this.plotAreaMargins = margins;
    this.plotArea = new ChartRect(
      margins.left,
      margins.top,
      this.width - margins.left - margins.right,
      this.height - margins.top - margins.bottom
    );

    this.legendArea = new ChartRect(
      0,
      this.plotArea.height,
      this.plotArea.width,
      legendHeight
    );

    this.graphDiameter = this.graph.getDiameter();
    this.levelGap = (this.plotArea.width - this.nodeWidth) / this.graphDiameter;

    this.nodes = this.graph.getNodes();
    this.edges = this.graph.getEdges();
    this.levelLabels = this.getLevelLabels(this.graphDiameter + 1);

    this.initNodesAndEdges();

    if (!this.options.layout) {
      const nodesByLevel = this.getNodesByLevel();

      // Calculate minimal node gap taking into account number of nodes on each level and
      // preferred value of a gap
      this.minNodeGap = this.getMinNodeGap(this.graph, this.height, this.nodeGap);
      this.scale = this.getYScale(nodesByLevel, this.options.minEdgeSizeRatio ?? 1);

      this.layoutNodesVertically(20);
      this.layoutEdgesVertically();
    } else {
      this.options.layout(this.graph, this);
    }
  }

  get nodeWidth(): number {
    return this.options.nodeWidth || 24;
  }

  get nodeGap(): number {
    return this.minNodeGap || this.options.nodeGap || 16;
  }

  getLevelParams(level: number): NodeLevelParams {
    const levelParams = this.options.levels && this.options.levels[level];
    return Object.assign({}, DEFAULT_LEVEL_PARAMS, levelParams);
  }


  initNodesAndEdges(): void {
    const levelOffsets = this.getLevelOffsets();

    // Initialize node parameters.
    this.nodes.forEach((node) => {
      const nodeDepth = this.graph.getMaxNodeDepth(node);

      node.x = levelOffsets[nodeDepth];
      node.width = this.nodeWidth;
      node.depth = nodeDepth;
    });
  }

  private getLevelOffsets(): number[] {
    const levelsCount = this.graph.getDiameter() + 1;
    const levelOffsets = new Array(levelsCount).fill(0)
      .map((v, level) => level * this.levelGap);

    for (let i = 1; i < levelsCount; i++) {
      const levelParams = this.getLevelParams(i);

      if (levelParams.stickTo === 'left') {
        const leftmostOffset = levelOffsets[i - 1];
        levelOffsets[i] = leftmostOffset + this.nodeWidth + (levelParams.stickPadding ?? 0);
      }
    }

    for (let i = levelsCount - 2; i >= 0; i--) {
      const levelParams = this.getLevelParams(i);

      if (levelParams.stickTo === 'right') {
        const rightmostOffset = levelOffsets[i + 1];
        levelOffsets[i] = rightmostOffset - this.nodeWidth - (levelParams.stickPadding ?? 0);
      }
    }

    return levelOffsets;
  }

  private getLevelLabels(levelsCount: number): LevelLabelItem[] {
    const levelOffsets = this.getLevelOffsets();
    const labelsItems: LevelLabelItem[] = new Array(levelsCount);

    for (let i = 0; i < levelsCount; i++) {
      let textAlign: LabelAlignment = this.getLevelParams(i).labelAlign ?? 'middle';
      let x = levelOffsets[i];

      if (!textAlign) {
        if (i === 0) {
          textAlign = 'left';
        } else if (i === levelsCount - 1) {
          textAlign = 'right';
        } else {
          textAlign = 'middle';
        }
      }

      if (textAlign === 'right') {
        x = x + this.nodeWidth;
      } else if (textAlign === 'middle') {
        x = x + this.nodeWidth / 2;
      }

      labelsItems[i] = {
        x,
        textAlign,
        index: i
      };
    }

    return labelsItems;
  }

  getEdgePathGenerator(): (d: SankeyEdge) => string {
    const curvature = 0.5;

    return (edge: SankeyEdge) => {
      const sourceNode = this.graph.getEdgeSource(edge);
      const targetNode = this.graph.getEdgeTarget(edge);

      const x0 = sourceNode.x + sourceNode.width;
      const x1 = targetNode.x;
      const xi = interpolateNumber(x0, x1);
      const x2 = xi(curvature);
      const x3 = xi(1 - curvature);
      const y0 = sourceNode.y + edge.sourceYOffset + edge.breadth / 2;
      const y1 = targetNode.y + edge.targetYOffset + edge.breadth / 2;

      return `M${x0},${y0} C${x2},${y0} ${x3},${y1} ${x1},${y1}`;
    };
  }

  private layoutEdgesVertically() {
    const incomingComparator = (a: SankeyEdge, b: SankeyEdge) => {
      return this.graph.getEdgeSource(a).y - this.graph.getEdgeSource(b).y;
    };

    const outgoingComparator = (a: SankeyEdge, b: SankeyEdge) => {
      return this.graph.getEdgeTarget(a).y - this.graph.getEdgeTarget(b).y;
    };

    // Sort edges and initialize Y offsets
    this.nodes.forEach((node: SankeyNode) => {
      let y = 0;

      this.graph.getIncomingEdgesOf(node)
        .sort((a, b) => incomingComparator(a, b))
        .forEach((edge) => {
          edge.targetYOffset = y;
          y += edge.breadth;
        });

      y = 0;
      this.graph.getOutgoingEdgesOf(node)
        .sort((a, b) => outgoingComparator(a, b))
        .forEach((edge) => {
          edge.sourceYOffset = y;
          y += edge.breadth;
        });
    });
  }

  private getNodesByLevel(): SankeyNode[][] {
    return nest<SankeyNode>()
      .key((d) => d.depth.toString())
      .sortKeys(ascending)
      .entries(this.nodes)
      .map(d => d.values);
  }

  private getYScale(nodesByBreadth: SankeyNode[][], minEdgeSizeRatio: number): number {
    if (minEdgeSizeRatio) {
      const minNodeSpace: number = this.getMinNodeSpace(this.graph, this.plotArea.height, this.nodeGap);
      const companyNodes = this.graph.getNodesByDepth(0);
      let total = companyNodes.reduce((acc, node) => acc + node.value, 0);

      this.minDisplayValue = total * minEdgeSizeRatio;
      total = companyNodes.reduce((acc, node) => acc + node.displayValue, 0);

      return minNodeSpace / total;
    }

    return min(nodesByBreadth, (nodes) => {
      const levelValue: number = sum(nodes, (d: SankeyNode) => d.value);
      return (this.plotArea.height - (nodes.length - 1) * this.nodeGap) / levelValue;
    }) ?? 1;
  }

  private getMinNodeGap(graph: SankeyGraph, height: number, nodeGap: number): number {
    // Which part of height is allowed to be used for gaps between nodes
    const maxGapRadio = 0.5;
    const maxGapTotal = maxGapRadio * height;
    let minNodeGap = nodeGap;

    let level = this.graph.getDiameter();

    while (level >= 0) {
      const gapsCount = graph.getNodesByDepth(level).length - 1;

      if (gapsCount * minNodeGap > maxGapTotal) {
        minNodeGap = maxGapTotal / gapsCount;
      }

      level--;
    }

    return minNodeGap;
  }

  private getMinNodeSpace(graph: SankeyGraph, height: number, nodeGap: number): number {
    const diameter = this.graph.getDiameter();
    const levelsToCalculate: number[] = new Array(diameter + 1).fill(0).map((v, i) => i);

    return min(levelsToCalculate, (level: number) => {
      const gapSize = (graph.getNodesByDepth(level).length - 1) * nodeGap;

      return (height - gapSize);
    }) ?? 0;
  }

  private layoutNodesVertically(iterations: number) {
    const nodesByLevel: SankeyNode[][] = this.getNodesByLevel();

    this.resolveCollisions(nodesByLevel);

    for (let alpha = 1; iterations > 0; --iterations) {
      this.relaxRightToLeft(alpha *= .9, nodesByLevel);
      this.resolveCollisions(nodesByLevel);
      this.relaxLeftToRight(alpha, nodesByLevel);
      this.resolveCollisions(nodesByLevel);
    }
  }

  private resolveCollisions(nodesByLevel: SankeyNode[][]) {
    nodesByLevel.forEach((levelNodes: SankeyNode[]) => {
      let dy: number;
      let y0 = 0;

      // Push any overlapping nodes down. Target position of nodes is determined by sorting function.
      // Currently comparison by `y` works better than comparison by value.
      const comparator = (a: SankeyNode, b: SankeyNode) => a.y - b.y;
      // const comparator = (a: SankeyNode, b: SankeyNode) => b.value - a.value;
      const sortedNodes: SankeyNode[] = [...levelNodes].sort(comparator);

      for (const node of sortedNodes) {
        dy = y0 - node.y;

        if (dy > 0) {
          node.y += dy;
        }

        y0 = node.y + node.breadth + this.nodeGap;
      }

      // If the bottommost node goes outside the bounds, push it back up.
      dy = y0 - this.nodeGap - this.plotArea.height;

      if (dy > 0) {
        let node: SankeyNode = sortedNodes[sortedNodes.length - 1];

        node.y -= dy;
        y0 = node.y;

        // Push any overlapping nodes back up.
        for (let i = sortedNodes.length - 2; i >= 0; --i) {
          node = sortedNodes[i];
          dy = node.y + node.breadth + this.nodeGap - y0;

          if (dy > 0) {
            node.y -= dy;
          }

          y0 = node.y;
        }
      }
    });
  }

  private relaxRightToLeft(alpha: number, nodesByLevel: SankeyNode[][]): void {
    // Reverse COPY of array
    [...nodesByLevel].reverse().forEach((levelNodes) => {
      levelNodes.forEach((node) => {
        const edges: SankeyEdge[] = this.graph.getOutgoingEdgesOf(node);

        if (edges.length) {
          const y = this.getNodeYIncrement(edges, true);
          node.y += (y - node.centerY) * alpha;
        }
      });
    });
  }

  private relaxLeftToRight(alpha: number, nodesByLevel: SankeyNode[][]): void {
    nodesByLevel.forEach((levelNodes) => {
      levelNodes.forEach((node) => {
        const edges: SankeyEdge[] = this.graph.getIncomingEdgesOf(node);

        if (edges.length) {
          const y = this.getNodeYIncrement(edges, false);
          node.y += (y - node.centerY) * alpha;
        }
      });
    });
  }

  private getNodeYIncrement(edges: SankeyEdge[], useTargetNodes: boolean): number {
    let weightedSum = 0;
    let valueSum = 0;
    let i = edges.length;

    // Use classic `while` loop instead of iterating with callbacks and calculate 2 sums at
    // a time for the best performance.
    while (--i >= 0) {
      const edge = edges[i];

      weightedSum += useTargetNodes ?
        this.graph.getEdgeTarget(edge).centerY * edge.value :
        this.graph.getEdgeSource(edge).centerY * edge.value;

      valueSum += edge.value;
    }

    return weightedSum / valueSum;
  }

}
