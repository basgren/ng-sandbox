import { Selection } from 'd3-selection';
import { D3Chart, D3ChartLegendItem } from '../d3-chart';
import { D3SankeyChartLayout, getTextAnchor, LevelLabelItem, SankeyEdge, SankeyNode } from './d3-sankey-chart-layout';
import { D3SankeyChartOptions } from './d3-sankey-chart-options';
import { DirectedGraph } from '../common/collections/directed-graph';

export interface NodeDef {
  id: string | number; // unique id of the node
  title?: string;

  [key: string]: any;
}

export interface EdgeDef {
  sourceNodeId: string | number;
  targetNodeId: string | number;
  value: number;

  [key: string]: any;
}

export interface SankeyDef {
  nodeDefs: NodeDef[];
  edgeDefs: EdgeDef[];
}

export type LabelAlignment = 'left' | 'right' | 'middle';
export type StickSide = 'left' | 'right';

export interface NodeLevelParams {
  title?: string;
  labelAlign?: LabelAlignment;
  nodeLabelAlign?: LabelAlignment;
  stickTo?: StickSide;
  stickPadding?: number;
}

export interface D3SankeyChartHighlight {
  nodes: NodeDef[] | null;
  edges: EdgeDef[] | null;
}

export type D3SankeyChartSelectionType = 'node' | 'edge';

export interface D3SankeyChartSelection {
  item: SankeyNode | SankeyEdge;
  type: D3SankeyChartSelectionType;
}

const MAX_SHRINK_LEVEL = 4;

function getLabelShrinkCssClass(level: number): string {
  return `node-label--shrink-${level}`;
}

export type SankeyGraph = DirectedGraph<SankeyNode, SankeyEdge>;

enum Layer {
  Edges = 'edges-layer',
  Nodes = 'nodes-layer',
  LevelLabels = 'level-labels-layer',
  Legend = 'legend-layer'
}

export class D3SankeyChart extends D3Chart<D3SankeyChartOptions> {
  private nodeDefs: NodeDef[] = [];
  private edgeDefs: EdgeDef[] = [];

  private layout: D3SankeyChartLayout = this.getNewLayout()

  private edgesMap: Map<EdgeDef, SankeyEdge> = new Map<EdgeDef, SankeyEdge>();
  private nodesMap: Map<NodeDef, SankeyNode> = new Map<NodeDef, SankeyNode>();

  private currentSelection: D3SankeyChartSelection | null = null;

  init() {
    this.element.classList.add('sankey');

    this.addLayers([
      Layer.Edges, Layer.Nodes, Layer.LevelLabels, Layer.Legend
    ]);
  }

  override render() {
    super.render();

    if (this.nodeDefs && this.edgeDefs) {
      this.layout = this.getNewLayout();

      // Initialize Def to Node map for faster lookup on hover events
      this.layout.nodes.forEach((node: SankeyNode) => {
        this.nodesMap.set(node.data, node);
      });
      this.layout.edges.forEach((edge: SankeyEdge) => {
        this.edgesMap.set(edge.data, edge);
      });

      this.chartContainer
        .attr('transform', `translate(${this.layout.plotArea.x},${this.layout.plotArea.y})`);

      this.renderEdges();
      this.renderNodes();
      this.renderLevelLabels();
      this.renderLegend();
    }
  }

  setData(data: SankeyDef) {
    const { nodeDefs, edgeDefs } = data;

    this.nodeDefs = nodeDefs;
    this.edgeDefs = edgeDefs;

    this.setSelection(null);

    this.render();
  }

  private getNewLayout(): D3SankeyChartLayout {
    return new D3SankeyChartLayout(this.width, this.height, this.nodeDefs, this.edgeDefs, this.options);
  }

  private renderEdges() {
    const pathGenerator = this.layout.getEdgePathGenerator();

    const edges = this.getEdgesSelection()
      .data<SankeyEdge>(this.layout.edges);

    const edgesEnter = edges
      .enter()
      .append('path')
      .classed('edge', true)
      .call(this.initEdgeHandlers.bind(this));

    if (this.options.getEdgeClass) {
      const self = this;

      //if (self.options) {
      edgesEnter.each(function (d) {
        const elem: SVGPathElement = this;
        const cssClass = self.options.getEdgeClass?.(d, self.graph);

        if (cssClass) {
          elem.classList.add(cssClass);
        }
      });

    }

    edgesEnter.merge(edges)
      .attr('d', pathGenerator)
      .style('stroke-width', d => Math.max(0, d.breadth))
      .style('stroke-linecap', 'butt');

    edges.exit()
      .remove();
  }

  // todo: refactor this method. maybe request graph directly from layout
  private get graph(): SankeyGraph {
    return this.layout?.graph;
  }

  private renderNodes() {
    const nodes = this.getNodesSelection()
      .data<SankeyNode>(this.layout.nodes)
      // reset classes
      .attr('class', 'node');

    const nodesEnter = nodes.enter()
      .append('g')
      // reset classes
      .attr('class', 'node')
      .classed('node--has-in-flow', (d) => this.graph.getIncomingEdgesOf(d).length > 0)
      .classed('node--has-out-flow', (d) => this.graph.getOutgoingEdgesOf(d).length > 0);

    nodesEnter
      .append('rect')
      .classed('node-rect', true)
      .call(this.initNodeHandlers.bind(this));

    nodesEnter
      .append('text')
      .classed('node-label', true);

    const nodesMerge = nodesEnter.merge(nodes)
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    nodesMerge
      .select<SVGRectElement>('.node-rect')
      .attr('width', (d: SankeyNode) => d.width)
      .attr('height', (d: SankeyNode) => d.breadth);

    const labels = nodesMerge
      .select<SVGTextElement>('.node-label')
      .attr('x', (d) => {
        const levelParams = this.layout.getLevelParams(d.depth);

        return levelParams.nodeLabelAlign === 'left' ?
          -this.layout.labelPadding :
          this.layout.labelPadding + this.layout.nodeWidth;
      })
      .attr('text-anchor', (d) => {
        const levelParams = this.layout.getLevelParams(d.depth);

        return levelParams.nodeLabelAlign === 'left' ? 'end' : 'start';
      })
      .attr('y', d => d.breadth / 2)
      .attr('dy', '.35em')
      .text((d) => d.title);

    this.shrinkOutOfBoundLabels(labels);

    nodes.exit()
      .remove();

    if (this.options.getNodeClass) {
      const self = this;
      nodesMerge.each(function (d) {
        const elem: SVGGElement = this;
        const cssClass = self.options.getNodeClass?.(d, self.graph);

        if (cssClass) {
          elem.classList.add(cssClass);
        }
      });
    }
  }

  private initNodeHandlers(selection: Selection<SVGRectElement, SankeyNode, SVGGElement, any>) {
    selection
      .on('mouseenter', (_, node: SankeyNode) => this.setHovered(this.getHighlightByNode(node), true))
      .on('mouseleave', (_, node: SankeyNode) => this.setHovered(this.getHighlightByNode(node), false))
      .on('click', (_, d) => this.toggleSelection({ type: 'node', item: d }));
  }

  private initEdgeHandlers(selection: Selection<SVGPathElement, SankeyEdge, any, any>) {
    selection
      .on('mouseenter', (_, d) => this.setHovered(this.getHighlightByEdge(d), true))
      .on('mouseleave', (_, d) => this.setHovered(this.getHighlightByEdge(d), false))
      .on('click', (_, d) => this.toggleSelection({ type: 'edge', item: d }));
  }

  private shrinkOutOfBoundLabels(labels: Selection<SVGTextElement, SankeyNode, any, any>) {
    const parentRect = this.element.getBoundingClientRect();
    const isOverlapping = (elem: SVGTextElement): boolean => {
      const rect = elem.getBoundingClientRect();
      return (rect.left < parentRect.left || rect.right > parentRect.right);
    };

    labels.each(function () {
      const elem: SVGTextElement = this;
      const initialClasses = elem.classList.value;
      let shrinkLevel = 1;

      while (isOverlapping(elem) && shrinkLevel <= MAX_SHRINK_LEVEL) {
        elem.classList.value = initialClasses;
        elem.classList.add(getLabelShrinkCssClass(shrinkLevel));
        shrinkLevel++;
      }
    });
  }

  private renderLevelLabels() {
    const labels = this.getLayer(Layer.LevelLabels).selectAll<SVGTextElement, LevelLabelItem>('text')
      .data(this.layout.levelLabels);

    const labelsEnter = labels
      .enter()
      .append('text')
      .classed('level-label', true)
      .attr('dy', '-8px');

    labelsEnter.merge(labels)
      .text((d) => this.layout?.getLevelParams(d.index).title ?? '')
      .attr('x', (d) => d.x)
      .attr('text-anchor', (d) => getTextAnchor(d.textAlign));

    labels.exit()
      .remove();
  }

  private renderLegend() {
    const legendLayer = this.getLayer(Layer.Legend);
    const self = this;
    const itemsMargin = 24;
    let prevElem: SVGGElement | null = null;

    const items = legendLayer.selectAll<SVGGElement, D3ChartLegendItem>('.legend-item')
      .data(this.options.legend || []);

    const itemsEnter = items.enter()
      .append('g');

    const radius = 8;

    itemsEnter
      .append('circle')
      .attr('r', 8)
      .attr('cx', radius)
      .attr('class', (d) => d.markCssClass ?? '');

    itemsEnter
      .append('text')
      .classed('sankey-legend-item__label', true)
      .attr('x', radius * 2 + radius)
      .text((d) => d.label);

    // Align items inside group
    itemsEnter.merge(items)
      .attr('transform', function () {
        let x = 0;

        if (prevElem) {
          const bbox = prevElem.getBBox();
          x = bbox.x + bbox.width + itemsMargin;
        }

        prevElem = this;

        return `translate(${x}, ${self.layout.legendArea.height / 1.5})`;
      });

    // Center legend taking into account resulting width of all items
    const legendBbox = legendLayer.node()!.getBBox(); // TODO: [VGren] remove non-null assrtion
    const legendX = this.layout.legendArea.centerX - legendBbox.width / 2;

    legendLayer
      .attr('transform', `translate(${legendX}, ${this.layout.plotArea.height})`);

    items.exit()
      .remove();
  }

  private getHighlightByNode(node: SankeyNode): D3SankeyChartHighlight {
    return this.options.getHighlightByNode ?
      this.options.getHighlightByNode(node, this.graph) :
      { nodes: [node.data], edges: null };
  }

  private getHighlightByEdge(edgeDef: SankeyEdge): D3SankeyChartHighlight {
    return this.options.getHighlightByEdge ?
      this.options.getHighlightByEdge(edgeDef, this.graph) :
      { nodes: null, edges: [edgeDef.data] };
  }

  private toggleSelection(selection: D3SankeyChartSelection) {
    if (!this.currentSelection || this.currentSelection.item !== selection.item) {
      this.setSelection(selection);
    } else {
      this.setSelection(null);
    }
  }

  private setSelection(selection: D3SankeyChartSelection | null) {
    this.currentSelection = selection;

    let highlight = null;

    if (selection) {
      highlight = selection.type === 'node' ?
        this.getHighlightByNode(selection.item as SankeyNode) :
        this.getHighlightByEdge(selection.item as SankeyEdge);
    }

    this.updateSelectionClasses(highlight, 'node--selected', 'edge--selected', selection !== null);

    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.currentSelection);
    }
  }

  private updateSelectionClasses(
    selection: D3SankeyChartHighlight | null,
    nodeCssClass: string,
    edgeCssClass: string,
    isActive: boolean
  ) {
    const nodeSet = new Set(this.getNodesByDefs((selection && selection.nodes) || []));
    const edgeSet = new Set(this.getEdgesByDefs((selection && selection.edges) || []));

    this.getNodesSelection().classed(nodeCssClass, (d) => isActive && nodeSet.has(d));
    this.getEdgesSelection().classed(edgeCssClass, (d) => isActive && edgeSet.has(d));
  }

  private getNodesByDefs(nodeDefs: NodeDef[] = []): SankeyNode[] {
    return nodeDefs.map((def) => this.nodesMap.get(def)!);
  }

  private getEdgesByDefs(edgeDefs: EdgeDef[] = []): SankeyEdge[] {
    return edgeDefs.map((def) => this.edgesMap.get(def)!);
  }

  private setHovered(selection: D3SankeyChartHighlight, isActive: boolean) {
    this.updateSelectionClasses(selection, 'node--hovered', 'edge--hovered', isActive);
  }

  private getNodesSelection(): Selection<SVGGElement, SankeyNode, SVGGElement, any> {
    return this.getLayer(Layer.Nodes).selectAll<SVGGElement, SankeyNode>('.node');
  }

  private getEdgesSelection(): Selection<SVGPathElement, SankeyEdge, SVGGElement, any> {
    return this.getLayer(Layer.Edges).selectAll<SVGPathElement, SankeyEdge>('.edge');
  }
}
