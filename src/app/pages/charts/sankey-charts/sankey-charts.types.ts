import { EdgeDef, NodeDef } from '../../../shared/charts/d3-sankey-chart/d3-sankey-chart';
import { CurrencyFlow } from './sankey-charts.mock';

export type NodeLevel = 'account' | 'transaction' | 'counterparty';

export class SankeyNodeDef implements NodeDef {
  readonly id: string;

  /**
   * Contains all flows that come through this node
   */
  readonly flows: CurrencyFlow[] = [];

  static getNodeId(flow: CurrencyFlow, level: NodeLevel): string {
    return [level, this.getCurrencyCode(flow, level)].join('-');
  }

  static getCurrencyCode(flow: CurrencyFlow, level: NodeLevel): string {
    switch (level) {
      case 'account':
        return flow.accountCurrencyCode;
      case 'transaction':
        return flow.transactionCurrencyCode;
      case 'counterparty':
        return flow.counterpartyCurrencyCode;
      default:
        throw new Error(`Unsupported NodeLevel value: ${level}`);
    }
  }

  /**
   * Sankey chart node definition model.
   * @param flow Flow that goes through this node.
   * @param level Level of the flow to which the node belongs
   */
  constructor(flow: CurrencyFlow, private level: NodeLevel) {
    this.id = SankeyNodeDef.getNodeId(flow, level);
    this.flows.push(flow);
  }

  get title(): string {
    return this.currencyCode;
  }

  get currencyCode(): string {
    return SankeyNodeDef.getCurrencyCode(this.flows[0], this.level);
  }
}

export class SankeyEdgeDef implements EdgeDef {
  constructor(public flow: CurrencyFlow, private sourceLevel: NodeLevel) {
  }

  get sourceNodeId(): string {
    return SankeyNodeDef.getNodeId(this.flow, this.sourceLevel);
  }

  get targetNodeId(): string {
    return SankeyNodeDef.getNodeId(this.flow, this.targetLevel);
  }

  get value(): number {
    return this.flow.paymentVolume;
  }

  get sourceCurrencyCode(): string {
    return this.getFlowCurrencyCode(this.sourceLevel);
  }

  get targetCurrencyCode(): string {
    return this.getFlowCurrencyCode(this.targetLevel);
  }

  private getFlowCurrencyCode(level: NodeLevel) {
    switch (level) {
      case 'account':
        return this.flow.accountCurrencyCode;
      case 'transaction':
        return this.flow.transactionCurrencyCode;
      case 'counterparty':
        return this.flow.counterpartyCurrencyCode;
      default:
        throw new Error(`Cannot find flow currency code for level "${level}"`);
    }
  }

  private get targetLevel(): NodeLevel {
    switch (this.sourceLevel) {
      case 'account':
        return 'transaction';
      case 'transaction':
        return 'counterparty';
      default:
        throw new Error(`Cannot find target level for source level "${this.sourceLevel}"`);
    }
  }
}
