
const CHART_SERIES_PALETTE = [
    '#2196F3',
    '#43A047',
    '#795548',
    '#AD1457',
    '#F44336',
    '#FFC107',
    '#00796B',
    '#8E24AA',
    '#9CCC65',
    '#9E9E9E',
    '#3F51B5',
    '#4DD0E1',
    '#FF9800',
    '#b575AD',
    '#607D8B',
    '#FFEB3B',
];

export function getSeriesColor(seriesIndex: number): string {
    return CHART_SERIES_PALETTE[seriesIndex % (CHART_SERIES_PALETTE.length)];
}

export class ChartMargins {
    top: number;
    bottom: number;
    left: number;
    right: number;

    constructor(margins: Partial<ChartMargins>) {
        this.top = margins.top || 0;
        this.bottom = margins.bottom || 0;
        this.left = margins.left || 0;
        this.right = margins.right || 0;
    }
}

export class ChartRect {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    get x2(): number {
        return this.x + this.width;
    }

    get y2(): number {
        return this.y + this.height;
    }

    get centerX(): number {
        return (this.x2 - this.x) / 2 + this.x;
    }

    get centerY(): number {
        return (this.y2 - this.y) / 2 + this.y;
    }
}
