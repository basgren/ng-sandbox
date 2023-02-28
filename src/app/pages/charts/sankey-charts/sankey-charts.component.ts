import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  SankeyChartComponent,
  SankeyChartSelectionEvent
} from '../../../components/sankey-chart/sankey-chart.component';
import { SankeyDef } from '../../../shared/charts/d3-sankey-chart/d3-sankey-chart';

@Component({
  selector: 'app-sankey-charts',
  standalone: true,
  imports: [CommonModule, SankeyChartComponent],
  templateUrl: './sankey-charts.component.html',
  styleUrls: ['./sankey-charts.component.scss']
})
export class SankeyChartsComponent implements OnInit {
  sankeyDefs: SankeyDef | null = null;
  selection: SankeyChartSelectionEvent | null = null;

  ngOnInit(): void {
    this.updateReportData();
  }

  private updateReportData() {
    this.sankeyDefs = {
      nodeDefs: [
        { id: 1, title: 'Left 1' },
        { id: 2, title: 'Left 2' },
        { id: 3, title: 'Center 3' },
        { id: 4, title: 'Right 4' },
        { id: 5, title: 'Right 5' },
        { id: 6, title: 'Right 6' },
        { id: 7, title: 'Target 7' },
        { id: 8, title: 'Target 8' },
      ],
      edgeDefs: [
        { sourceNodeId: 1, targetNodeId: 3, value: 50 },
        { sourceNodeId: 2, targetNodeId: 3, value: 100 },
        { sourceNodeId: 3, targetNodeId: 4, value: 25 },
        { sourceNodeId: 3, targetNodeId: 5, value: 50 },
        { sourceNodeId: 3, targetNodeId: 6, value: 75 },
        { sourceNodeId: 6, targetNodeId: 7, value: 15 },
        { sourceNodeId: 5, targetNodeId: 8, value: 50 },
        { sourceNodeId: 4, targetNodeId: 7, value: 25 },
        { sourceNodeId: 6, targetNodeId: 8, value: 60 },
      ]
    };
  }

}
