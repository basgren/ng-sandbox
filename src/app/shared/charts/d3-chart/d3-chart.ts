import { select, Selection } from 'd3-selection';
import * as elementResizeDetectorMaker from 'element-resize-detector';
import { debounce } from '../../utils/func-utils';

const elementResizeDetector = elementResizeDetectorMaker({
  strategy: 'scroll',
  callOnAdd: false
});

export type D3ChartLayerSelection = Selection<SVGGElement, any, SVGSVGElement, any>;

export interface D3ChartOptions {
  element?: HTMLElement;
}

export abstract class D3Chart<O extends D3ChartOptions> {
  readonly element: HTMLElement;
  readonly svg: Selection<SVGSVGElement, any, HTMLElement, any>;
  readonly chartContainer: Selection<SVGGElement, any, SVGSVGElement, any>;

  private layers: Map<string, D3ChartLayerSelection> = new Map<string, D3ChartLayerSelection>();

  constructor(element: HTMLElement, protected readonly options: O) {
    this.element = element;
    this.renderContainer();

    const $elem: Selection<HTMLElement, any, any, any> = select(this.element);
    this.svg = $elem.select('svg');
    this.chartContainer = $elem.select('.d3-chart');

    this.init();

    // TODO: [VGren] Replace with ResizeObserver?
    elementResizeDetector.listenTo(this.element, debounce(() => {
      this.onResize();
    }, 250));

    this.onResize();
  }

  abstract init(): void;

  render() {
    // this.renderDebugInfo();
  }

  destroy() {

  }

  get width() {
    return this.element.clientWidth;
  }

  get height() {
    return this.element.clientHeight;
  }

  onResize() {
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    this.render();
  }

  addLayers(names: string[], parentLayerName?: string): void {
    names.forEach(name => this.addLayer(name, parentLayerName));
  }

  addLayer(name: string, parentLayerName?: string): D3ChartLayerSelection {
    const parent = parentLayerName ?
      this.getLayer(parentLayerName) :
      this.chartContainer;

    const layer: D3ChartLayerSelection = parent
      .append('g')
      .classed(name, true);

    this.layers.set(name, layer);

    return layer;
  }

  getLayer(name: string): D3ChartLayerSelection {
    let layer = this.layers.get(name);

    if (layer) {
      return layer;
    }

    const layers = Array.from(this.layers.keys()).map((layerName) => `"${layerName}"`);
    throw new Error(`Cannot find chart layer named "${name}". Available layers: ${layers.join(', ')}`);
  }

  updateOptions(options: O): void {
    Object.assign(this.options, options);
  }

  private renderContainer(): void {
    this.element.innerHTML = `<svg class="d3-chart-svg"><g class="d3-chart"></g></svg>`;
  }

  // private renderDebugInfo() {
  //   const $debugLayer: any = this.svg.selectAll('.debug-layer')
  //     .data([this]);
  //
  //   const $enterLayer: Selection<SVGGElement, any, SVGSVGElement, any> = $debugLayer.enter()
  //     .insert('g', '.d3-chart')
  //     .classed('debug-layer', true);
  //
  //   $enterLayer
  //     .append('rect');
  //
  //   $enterLayer.merge($debugLayer)
  //     .select('rect')
  //     .attr('x', 0)
  //     .attr('y', 0)
  //     .attr('width', this.svg.node()?.clientWidth ?? 300)
  //     .attr('height', this.svg.node()?.clientHeight ?? 200);
  // }

}
