import { ChartMargins } from '../common/charts-common';
import { D3ChartLegendItem, D3ChartOptions } from '../d3-chart';
import { D3SankeyChartHighlight, D3SankeyChartSelection, NodeLevelParams, SankeyGraph } from './d3-sankey-chart';
import { D3SankeyChartLayout, SankeyEdge, SankeyNode } from './d3-sankey-chart-layout';

export interface D3SankeyChartOptions extends D3ChartOptions {
  /**
   * Parameters of each sankey chart level.
   */
  levels?: NodeLevelParams[];

  /**
   * Callback that allows to extend set of edges and nodes which should be highlighted on mouse hover
   * and selected on click.
   *
   * @param edge Edge that is currently clicked of hovered.
   */
  getHighlightByEdge?: (edge: SankeyEdge, graph: SankeyGraph) => D3SankeyChartHighlight;
  getHighlightByNode?: (node: SankeyNode, graph: SankeyGraph) => D3SankeyChartHighlight;

  /**
   * Hook that allows to add extra class to an edge. Should return array of strings with classes to
   * be added to provided edge. Callback should return null if no classes should be added.
   */
  getEdgeClass?: (edge: SankeyEdge, graph: SankeyGraph) => string;

  /**
   * Hook that allows to add extra class to a node. Should return array of strings with classes to
   * be added to provided node. Callback should return null if no classes should be added.
   */
  getNodeClass?: (node: SankeyNode, graph: SankeyGraph) => string;

  /**
   * Callback invoked each time when selection is changed (edges or node is selected or deselected).
   */
  onSelectionChange?: (selection: D3SankeyChartSelection | null) => void;

  /**
   * When specified, custom legend will be displayed.
   */
  legend?: D3ChartLegendItem[];

  margins?: Partial<ChartMargins>;

  nodeWidth?: number;

  /**
   * Vertical gap between nodes of the same level.
   */
  nodeGap?: number;

  /**
   * When specified, the minimal size of each edge will be limited to specified value (approximately). The value
   * is specified in parts of total node height in one level. For example, if on sankey chart on some level
   * we have sum of node height = 100px, setting this value to 0.02 will limit minimal size of an edge
   * to 100px * 0.02 = 2px (approximately, as current algorithm is simplified in favor of performance, so
   * actual minimal size may slightly differ). This parameter is useful when the data contain both very big and very
   * small values, so small values without this limit will have size less then one pixel, which might prevent them
   * to be selected.
   */
  minEdgeSizeRatio?: number;

  /**
   * It's possible to specify custom layout callback, in this case it will be called INSTEAD of built-in layout
   * function. The callback is invoked after nodes are initialized, but before they are rendered. So in the callback
   * it's necessary to traverse all nodes and edges in the graph and set x and y coordinates for them.
   */
  layout?: (graph: SankeyGraph, layout: D3SankeyChartLayout) => void;
}
