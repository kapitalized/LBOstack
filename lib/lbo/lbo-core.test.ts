import { describe, it, expect } from 'vitest';
import { simulateLboModel } from './lbo-core';
import type { LboDealSchema } from './types';

describe('lbo-core', () => {
  it('sweeps senior-first by priority', () => {
    const deal: LboDealSchema = {
      periodCount: 2,
      monthsPerPeriod: 1,
      operatingCashFlows: [60, 0],
      transaction: {
        purchasePrice: 120,
        exit: { type: 'multiple', exitMultiple: 1 },
        transactionFees: 0,
      },
      debt: {
        tranches: [
          // Intentionally reversed order; priority should control sweep.
          { id: 'junior', name: 'Junior', initialPrincipal: 50, annualInterestRate: 0, priority: 1, amortization: { type: 'interest_only' } },
          { id: 'senior', name: 'Senior', initialPrincipal: 50, annualInterestRate: 0, priority: 0, amortization: { type: 'interest_only' } },
        ],
      },
      sweep: { distributeResidualToEquity: true, timing: 'end_of_period' },
      equity: { initialEquityInvested: 20 },
      liquidityReserve: { minCashBalance: 0 },
    };

    const model = simulateLboModel(deal);
    const row0 = model.schedule.rows[0];

    expect(row0.principalPaidByTranche.senior).toBeCloseTo(50);
    expect(row0.principalPaidByTranche.junior).toBeCloseTo(10);
    expect(row0.debtBalanceByTranche.senior).toBeCloseTo(0);
    expect(row0.debtBalanceByTranche.junior).toBeCloseTo(40);
    expect(row0.equityDistribution).toBeCloseTo(0);
  });

  it('computes MOIC correctly on a simple example', () => {
    const deal: LboDealSchema = {
      periodCount: 2,
      monthsPerPeriod: 1,
      operatingCashFlows: [60, 0],
      transaction: {
        purchasePrice: 120,
        exit: { type: 'multiple', exitMultiple: 1 },
        transactionFees: 0,
      },
      debt: {
        tranches: [
          { id: 'senior', name: 'Senior', initialPrincipal: 50, annualInterestRate: 0, priority: 0, amortization: { type: 'interest_only' } },
          { id: 'junior', name: 'Junior', initialPrincipal: 50, annualInterestRate: 0, priority: 1, amortization: { type: 'interest_only' } },
        ],
      },
      sweep: { distributeResidualToEquity: true, timing: 'end_of_period' },
      equity: { initialEquityInvested: 20 },
      liquidityReserve: { minCashBalance: 0 },
    };

    const model = simulateLboModel(deal);
    expect(model.metrics.moic).toBeCloseTo(4, 10);
  });

  it('computes annualized IRR for the simple example', () => {
    const deal: LboDealSchema = {
      periodCount: 2,
      monthsPerPeriod: 1,
      operatingCashFlows: [60, 0],
      transaction: {
        purchasePrice: 120,
        exit: { type: 'multiple', exitMultiple: 1 },
        transactionFees: 0,
      },
      debt: {
        tranches: [
          { id: 'senior', name: 'Senior', initialPrincipal: 50, annualInterestRate: 0, priority: 0, amortization: { type: 'interest_only' } },
          { id: 'junior', name: 'Junior', initialPrincipal: 50, annualInterestRate: 0, priority: 1, amortization: { type: 'interest_only' } },
        ],
      },
      sweep: { distributeResidualToEquity: true, timing: 'end_of_period' },
      equity: { initialEquityInvested: 20 },
      liquidityReserve: { minCashBalance: 0 },
    };

    const model = simulateLboModel(deal);

    // Cashflows on equity: [-20, 0, 80] with 1-month periods (end of each modeled period).
    // Periodic IRR r solves: -20 + 80/(1+r)^2 = 0 => (1+r)^2 = 4 => r = 1.
    // Annualized IRR = (1+r)^12 - 1 = 2^12 - 1 = 4095.
    const expectedAnnualized = Math.pow(2, 12) - 1;
    expect(model.metrics.irrAnnualized).toBeCloseTo(expectedAnnualized, 6);
  });
});

