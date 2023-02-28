
export type CurrencyFlowDirection = 'incoming' | 'outgoing';

export interface CurrencyFlow {
    accountCurrencyCode: string;
    transactionCurrencyCode: string;
    counterpartyCurrencyCode: string;

    /**
     * Defines flow direction.
     * When 'incoming', it means that funds flow from counterparty to account (through
     * transaction currency), when 'outgoing' - the flow is from account to counterparty.
     */
    direction: CurrencyFlowDirection;

    /**
     * Total volume of payments in the flow in customer's currency. This is not the currency
     * specified in `counterpartyCurrencyCode`, but main currency of customer, so that all
     * flows have the same currency and can be compared and aggregated.
     */
    paymentVolume: number;

    /**
     * Number of payments in current flow.
     */
    paymentCount: number;
    ucCurrency: boolean;
}

export interface TransactionCurrency {
    code: string;
    isApproved: boolean;
}

export interface CurrencyFlowReport {
    flows: CurrencyFlow[];
    currencies: TransactionCurrency[];
}

export function getCurrencyFlowReportMock(): CurrencyFlowReport {
    const currencies: TransactionCurrency[] = [
        {code: 'EUR', isApproved: true},
        {code: 'USD', isApproved: true},
        {code: 'GBP', isApproved: true},
        {code: 'RUB', isApproved: true},
        {code: 'CAD', isApproved: true},
        {code: 'YEN', isApproved: false}
    ];

    const flows: CurrencyFlow[] = [
        {accountCurrencyCode: 'EUR', transactionCurrencyCode: 'EUR', counterpartyCurrencyCode: 'RUB', direction: 'outgoing',
            paymentVolume: 10000, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'EUR', transactionCurrencyCode: 'EUR', counterpartyCurrencyCode: 'GTB', direction: 'outgoing',
            paymentVolume: 20, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'EUR', transactionCurrencyCode: 'RUB', counterpartyCurrencyCode: 'YEN', direction: 'outgoing',
            paymentVolume: 10, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'EUR', transactionCurrencyCode: 'RUB', counterpartyCurrencyCode: 'USD', direction: 'outgoing',
            paymentVolume: 10, paymentCount: 10, ucCurrency: false},

        {accountCurrencyCode: 'USD', transactionCurrencyCode: 'USD', counterpartyCurrencyCode: 'GTB', direction: 'outgoing',
            paymentVolume: 10, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'USD', transactionCurrencyCode: 'USD', counterpartyCurrencyCode: 'USD', direction: 'outgoing',
            paymentVolume: 10, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'USD', transactionCurrencyCode: 'USD', counterpartyCurrencyCode: 'EUR', direction: 'outgoing',
            paymentVolume: 30, paymentCount: 10, ucCurrency: false},
        {accountCurrencyCode: 'USD', transactionCurrencyCode: 'YEN', counterpartyCurrencyCode: 'EUR', direction: 'outgoing',
            paymentVolume: 20, paymentCount: 10, ucCurrency: true},
        {accountCurrencyCode: 'USD', transactionCurrencyCode: 'YEN', counterpartyCurrencyCode: 'CAD', direction: 'outgoing',
            paymentVolume: 30, paymentCount: 10, ucCurrency: false},
    ];

    console.log('>>>> Flows count', flows.length);

    return {flows, currencies};
}

export function getCurrencyFlowReportBigMock(): CurrencyFlowReport {
    const getFlow = (accountCurrencyCode: string,
                     transactionCurrencyCode: string,
                     counterpartyCurrencyCode: string,
                     direction: CurrencyFlowDirection,
                     paymentVolume: number, paymentCount: number, ucCurrency: boolean): CurrencyFlow => {
        return {accountCurrencyCode, transactionCurrencyCode, counterpartyCurrencyCode, direction,
            paymentVolume, paymentCount, ucCurrency};
    };

    const currencies: TransactionCurrency[] = [
        {code: 'EUR', isApproved: true},
        {code: 'USD', isApproved: true},
        {code: 'GTB', isApproved: true},
        {code: 'RUB', isApproved: true},
        {code: 'CAD', isApproved: true},
        {code: 'YEN', isApproved: false},
        {code: 'CUR1', isApproved: false},
        {code: 'CUR2', isApproved: false},
        {code: 'CUR3', isApproved: false},
        {code: 'CUR4', isApproved: false},
        {code: 'CUR5', isApproved: false},
        {code: 'CUR6', isApproved: false},
        {code: 'CUR7', isApproved: false},
        {code: 'CUR8', isApproved: false},
        {code: 'CUR9', isApproved: false},
        {code: 'CUR10', isApproved: false},
    ];

    const flows: CurrencyFlow[] = [
        getFlow('EUR', 'EUR', 'RUB', 'outgoing', 10000, 10, false),
        getFlow('EUR', 'EUR', 'GTB', 'outgoing', 20, 10, false),
        getFlow('EUR', 'RUB', 'YEN', 'outgoing', 10, 10, false),
        getFlow('EUR', 'RUB', 'USD', 'outgoing', 10, 10, false),
        getFlow('USD', 'USD', 'GTB', 'outgoing', 10, 10, false),
        getFlow('USD', 'USD', 'USD', 'outgoing', 10, 10, false),
        getFlow('USD', 'USD', 'EUR', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'EUR', 'outgoing', 20, 10, true),
        getFlow('USD', 'YEN', 'CAD', 'outgoing', 30, 10, false),

        getFlow('USD', 'YEN', 'CUR1', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR2', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR3', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR4', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR5', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR6', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR7', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR8', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR9', 'outgoing', 30, 10, false),
        getFlow('USD', 'YEN', 'CUR10', 'outgoing', 30, 10, false),
    ];

    console.log('>>>> Flows count', flows.length);

    return {flows, currencies};
}
