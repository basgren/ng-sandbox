import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  D3SankeyChart,
  D3SankeyChartHighlight,
  D3SankeyChartSelection,
  D3SankeyChartSelectionType,
  EdgeDef,
  NodeDef,
  SankeyDef,
  SankeyGraph
} from '../../shared/charts/d3-sankey-chart/d3-sankey-chart';
import { SankeyEdge, SankeyNode } from '../../shared/charts/d3-sankey-chart/d3-sankey-chart-layout';

export type SankeyChartSelectionType = D3SankeyChartSelectionType;

export interface SankeyChartSelectionEvent {
  type: SankeyChartSelectionType;
  item: NodeDef | EdgeDef;
}

@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sankey-chart.component.html',
  styleUrls: ['./sankey-chart.component.scss']
})
export class SankeyChartComponent implements AfterViewInit, OnChanges {
  @Input() data: SankeyDef | null = null;
  @Output() selectionChange = new EventEmitter<SankeyChartSelectionEvent | null>();
  @ViewChild('chartContainer', { static: true }) sankeyContainer!: ElementRef;

  private sankey: D3SankeyChart | null = null;

  ngAfterViewInit(): void {
    this.initChart();
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.updateChartData();
    }
  }

  private initChart() {
    this.sankey = new D3SankeyChart(this.sankeyContainer.nativeElement, {
      minEdgeSizeRatio: 0.015,

      levels: [{
        title: 'Level 1',
        nodeLabelAlign: 'left'
      }, {
        title: 'Level 2',
        nodeLabelAlign: 'left'
      }, {
        title: 'Level 3',
        nodeLabelAlign: 'right'
      }],

      legend: [{
        label: 'Label 1',
        markCssClass: 'sankey-legend-item--green'
      }, {
        label: 'Label 2',
        markCssClass: 'sankey-legend-item--gray'
      }],

      onSelectionChange: (selection: D3SankeyChartSelection | null) => {
        this.updateSelectionDetails(selection);
      },

      getHighlightByEdge: (edge: SankeyEdge, graph: SankeyGraph): D3SankeyChartHighlight => {
        return {
          edges: [edge.data],
          nodes: [
            graph.getEdgeSource(edge).data,
            graph.getEdgeTarget(edge).data
          ]
        };
      },

      getHighlightByNode: (node: SankeyNode, graph: SankeyGraph): D3SankeyChartHighlight => {
        const edges = graph.getEdgesOf(node).map((n) => n.data);

        return {
          edges,
          nodes: [node.data]
        };
      },
    });
  }

  private updateChartData() {
    if (!this.sankey || !this.data) {
      return;
    }

    this.sankey.setData(this.data);
  }

  private updateSelectionDetails(selection: D3SankeyChartSelection | null) {
    let event: SankeyChartSelectionEvent | null = null;

    if (selection) {
      event = {
        type: selection.type,
        item: selection?.item.data!
      };
    }

    this.selectionChange.emit(event);
  }
}
