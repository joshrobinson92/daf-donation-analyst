// DAF Donation Analyst - Unit Tests for Calculator Logic

import { calculateProjections, calculateTaxSavings } from './calculator.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('Starting Calculator Unit Tests...');

  // --- Test 1: calculateProjections (Percent-based giving) ---
  console.log('Running Test 1: Projection calculations (Percent-based)...');
  const projResult = calculateProjections({
    initialBalance: 100000,
    annualContribution: 10000,
    grantType: 'percent',
    grantValue: 10,       // 10%
    annualGrowthRate: 10, // 10%
    years: 2
  });

  // Verify length
  assert(projResult.length === 3, `Expected 3 years (0, 1, 2) in results, got ${projResult.length}`);

  // Year 0
  const y0 = projResult[0];
  assert(y0.year === 0, 'Year 0 index wrong');
  assert(y0.endBalance === 100000, 'Year 0 endBalance wrong');
  assert(y0.cumulativeGrants === 0, 'Year 0 cumulativeGrants should be 0');

  // Year 1
  // Start: 100000
  // Contribution: 10000 -> 110000 before growth
  // Growth: 10% of 110000 = 11000 -> 121000 before grant
  // Grant: 10% of 121000 = 12100
  // End: 121000 - 12100 = 108900
  // Cumulative Grants: 12100
  const y1 = projResult[1];
  assert(y1.year === 1, 'Year 1 index wrong');
  assert(y1.startBalance === 100000, `Year 1 startBalance wrong: expected 100000, got ${y1.startBalance}`);
  assert(y1.contribution === 10000, `Year 1 contribution wrong: expected 10000, got ${y1.contribution}`);
  assert(y1.growth === 11000, `Year 1 growth calculation wrong: expected 11000, got ${y1.growth}`);
  assert(y1.grantPaid === 12100, `Year 1 grantPaid calculation wrong: expected 12100, got ${y1.grantPaid}`);
  assert(y1.endBalance === 108900, `Year 1 endBalance calculation wrong: expected 108900, got ${y1.endBalance}`);
  assert(y1.cumulativeGrants === 12100, `Year 1 cumulativeGrants calculation wrong: expected 12100, got ${y1.cumulativeGrants}`);

  // Year 2
  // Start: 108900
  // Contribution: 10000 -> 118900 before growth
  // Growth: 10% of 118900 = 11890 -> 130790 before grant
  // Grant: 10% of 130790 = 13079
  // End: 130790 - 13079 = 117711
  // Cumulative Grants: 12100 + 13079 = 25179
  const y2 = projResult[2];
  assert(y2.year === 2, 'Year 2 index wrong');
  assert(y2.startBalance === 108900, `Year 2 startBalance wrong: expected 108900, got ${y2.startBalance}`);
  assert(y2.contribution === 10000, `Year 2 contribution wrong: expected 10000, got ${y2.contribution}`);
  assert(y2.growth === 11890, `Year 2 growth calculation wrong: expected 11890, got ${y2.growth}`);
  assert(y2.grantPaid === 13079, `Year 2 grantPaid calculation wrong: expected 13079, got ${y2.grantPaid}`);
  assert(y2.endBalance === 117711, `Year 2 endBalance calculation wrong: expected 117711, got ${y2.endBalance}`);
  assert(y2.cumulativeGrants === 25179, `Year 2 cumulativeGrants calculation wrong: expected 25179, got ${y2.cumulativeGrants}`);

  console.log('✅ Test 1 Passed.');

  // --- Test 2: calculateProjections (Fixed dollar-based giving) ---
  console.log('Running Test 2: Projection calculations (Fixed Dollar)...');
  const projFixedResult = calculateProjections({
    initialBalance: 100000,
    annualContribution: 0,
    grantType: 'fixed',
    grantValue: 50000,
    annualGrowthRate: 10, // 10%
    years: 1
  });

  // Year 1 (Fixed)
  // Start: 100000, Contribution: 0 -> 100000
  // Growth: 10% of 100000 = 10000 -> 110000 before grant
  // Grant: Fixed 50000
  // End: 110000 - 50000 = 60000
  const y1Fixed = projFixedResult[1];
  assert(y1Fixed.grantPaid === 50000, `Expected fixed grant of 50000, got ${y1Fixed.grantPaid}`);
  assert(y1Fixed.endBalance === 60000, `Expected ending balance of 60000, got ${y1Fixed.endBalance}`);
  console.log('✅ Test 2 Passed.');

  // --- Test 3: calculateTaxSavings ---
  console.log('Running Test 3: Tax savings (Cash vs Appreciated Stock)...');
  const taxSavings = calculateTaxSavings({
    donationAmount: 50000,
    costBasisPercent: 30, // 30% basis, 70% gain ($35000 gain)
    ordinaryTaxRate: 37,  // 37% ord income tax rate
    capGainsTaxRate: 20   // 20% cap gains rate
  });

  // CASH DONATION
  // Income tax savings: 37% of 50000 = 18500
  // Cap gains savings: 0
  // Net cost: 50000 - 18500 = 31500
  assert(taxSavings.cash.incomeTaxSavings === 18500, `Cash income tax savings wrong: expected 18500, got ${taxSavings.cash.incomeTaxSavings}`);
  assert(taxSavings.cash.capGainsSavings === 0, `Cash cap gains savings should be 0, got ${taxSavings.cash.capGainsSavings}`);
  assert(taxSavings.cash.netCost === 31500, `Cash net cost wrong: expected 31500, got ${taxSavings.cash.netCost}`);

  // APPRECIATED STOCK DONATION
  // Gain: 70% of 50000 = 35000
  // Cap gains tax saved: 20% of 35000 = 7000
  // Income tax savings: 37% of 50000 = 18500
  // Total savings: 18500 + 7000 = 25500
  // Net cost: 50000 - 25500 = 24500
  assert(taxSavings.stock.incomeTaxSavings === 18500, `Stock income tax savings wrong: expected 18500, got ${taxSavings.stock.incomeTaxSavings}`);
  assert(taxSavings.stock.capGainsSavings === 7000, `Stock cap gains savings wrong: expected 7000, got ${taxSavings.stock.capGainsSavings}`);
  assert(taxSavings.stock.totalSavings === 25500, `Stock total savings wrong: expected 25500, got ${taxSavings.stock.totalSavings}`);
  assert(taxSavings.stock.netCost === 24500, `Stock net cost wrong: expected 24500, got ${taxSavings.stock.netCost}`);

  // Stock vs Cash Benefit
  // Cost difference: 31500 - 24500 = 7000
  assert(taxSavings.stockBenefitVsCash === 7000, `Stock benefit vs Cash wrong: expected 7000, got ${taxSavings.stockBenefitVsCash}`);

  console.log('✅ Test 3 Passed.');
  console.log('🎉 All Calculator Unit Tests Passed Successfully!');
}

runTests();
