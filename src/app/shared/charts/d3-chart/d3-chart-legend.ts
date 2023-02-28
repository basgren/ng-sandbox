import { Selection } from 'd3-selection';
import { D3ChartLayerSelection } from './d3-chart';

type D3ChartLegendItemShape = 'circle' | 'square';

export interface D3ChartLegendItem {
  label: string;
  markCssClass?: string;
  color?: string;
}

export interface D3ChartLegendOptions {
  items: D3ChartLegendItem[];
  shape?: D3ChartLegendItemShape;
  height: number;
  width: number;
}

const itemsMargin = 24;
const markSize = 16;
const labelPadding = 6;

export function renderChartLegend(layer: D3ChartLayerSelection, options: D3ChartLegendOptions) {
  let legendGroup = layer.selectAll<SVGGElement, null>('.legend-items')
    .data([null]);

  legendGroup = legendGroup.enter()
    .append('g')
    .classed('legend-items', true)
    .merge(legendGroup);

  const items = legendGroup.merge(legendGroup)
    .selectAll<SVGGElement, D3ChartLegendItem>('g')
    .data(options.items);

  const markRenderer = (options.shape && options.shape === 'square') ?
    renderSquareMark :
    renderRoundMark;

  const itemsEnter = items.enter().append('g');

  itemsEnter
    .call(markRenderer, markSize)
    .attr('class', (d) => d.markCssClass ?? null);

  itemsEnter
    .append('text')
    .classed('legend-item__label', true)
    .attr('x', markSize + labelPadding)
    .text((d) => d.label);

  // Align items inside group
  let x = 0;

  itemsEnter.merge(items)
    .attr('transform', function () {
      const result = `translate(${x}, ${options.height / 2})`;

      x = x + this.getBBox().width + itemsMargin;

      return result;
    });

  // Center legend taking into account resulting width of all items
  const legendBbox = legendGroup.node()!.getBBox(); // TODO: [VGren] get rid of null-assertion
  const legendX = (options.width - legendBbox.width) / 2;

  legendGroup
    .attr('transform', `translate(${legendX}, 0)`);

  items.exit()
    .remove();
}

function renderRoundMark(selection: Selection<SVGGElement, any, any, any>, size: number): void {
  selection.append('circle')
    .attr('r', size / 2)
    .attr('cx', size / 2)
    .style('fill', (d) => d.color);
}

function renderSquareMark(selection: Selection<SVGGElement, any, any, any>, size: number) {
  selection.append('rect')
    .attr('x', 0)
    .attr('y', -size / 2)
    .attr('width', size)
    .attr('height', size)
    .style('fill', (d) => d.color);
}
