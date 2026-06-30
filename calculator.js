// DAF Donation Analyst - Calculator Module

/**
 * Calculates DAF projections year-by-year
 * @param {number} initialBalance 
 * @param {number} annualContribution 
 * @param {string} grantType 'percent' or 'fixed'
 * @param {number} grantValue The percentage (0-100) or annual dollar amount
 * @param {number} annualGrowthRate Expected return rate (0-100)
 * @param {number} years Duration of projection (1-30)
 * @returns {Array<Object>} Array of year-by-year metrics
 */
export function calculateProjections({
  initialBalance,
  annualContribution,
  grantType,
  grantValue,
  annualGrowthRate,
  years
}) {
  const projections = [];
  let currentBalance = initialBalance;
  let cumulativeGrants = 0;
  let cumulativeContributions = initialBalance;

  // Year 0 - Initial state
  projections.push({
    year: 0,
    startBalance: currentBalance,
    contribution: 0,
    growth: 0,
    grantPaid: 0,
    endBalance: currentBalance,
    cumulativeGrants: 0,
    cumulativeContributions: initialBalance
  });

  const growthMultiplier = annualGrowthRate / 100;
  const grantPercentMultiplier = grantValue / 100;

  for (let year = 1; year <= years; year++) {
    const startBalance = currentBalance;
    
    // 1. Contribution added at beginning of year
    const contribution = annualContribution;
    const balanceBeforeGrowth = startBalance + contribution;
    cumulativeContributions += contribution;

    // 2. Growth calculated mid/end-of-year on balance before growth
    const growth = balanceBeforeGrowth * growthMultiplier;
    const balanceAfterGrowth = balanceBeforeGrowth + growth;

    // 3. Grant payout calculated
    let grantPaid = 0;
    if (grantType === 'percent') {
      grantPaid = balanceAfterGrowth * grantPercentMultiplier;
    } else {
      // Fixed dollar grant, capped at the total available balance
      grantPaid = Math.min(grantValue, balanceAfterGrowth);
    }
    
    // 4. Ending balance
    const endBalance = Math.max(0, balanceAfterGrowth - grantPaid);
    
    cumulativeGrants += grantPaid;
    currentBalance = endBalance;

    projections.push({
      year,
      startBalance,
      contribution,
      growth,
      grantPaid,
      endBalance,
      cumulativeGrants,
      cumulativeContributions
    });
  }

  return projections;
}

/**
 * Calculates tax benefits comparing cash vs appreciated stock donations
 * @param {number} donationAmount Total value of the asset to donate
 * @param {number} costBasisPercent What percentage of the current value is cost basis (0-100)
 * @param {number} ordinaryTaxRate Ordinary income tax rate (0-100)
 * @param {number} capGainsTaxRate Capital gains tax rate (0-100) (including state/federal)
 * @returns {Object} Tax savings breakdown
 */
export function calculateTaxSavings({
  donationAmount,
  costBasisPercent,
  ordinaryTaxRate,
  capGainsTaxRate
}) {
  const ordTaxMult = ordinaryTaxRate / 100;
  const capGainsMult = capGainsTaxRate / 100;
  const costBasisMult = costBasisPercent / 100;

  // CASH DONATION
  const cashIncomeTaxSavings = donationAmount * ordTaxMult;
  const cashNetCost = donationAmount - cashIncomeTaxSavings;

  // APPRECIATED STOCK DONATION
  const stockBasis = donationAmount * costBasisMult;
  const stockGain = donationAmount - stockBasis;
  const stockCapGainsSaved = stockGain * capGainsMult;
  const stockIncomeTaxSavings = donationAmount * ordTaxMult; // Full fair market value deduction
  const stockTotalSavings = stockIncomeTaxSavings + stockCapGainsSaved;
  const stockNetCost = donationAmount - stockTotalSavings;

  // LIQUIDATE THEN DONATE (Alternative)
  // If they sold the stock first, paid capital gains, then donated remaining cash
  const paidCapGainsOnSale = stockGain * capGainsMult;
  const cashLeftToDonate = donationAmount - paidCapGainsOnSale;
  const liquidateIncomeTaxSavings = cashLeftToDonate * ordTaxMult;
  const liquidateNetTaxSavings = liquidateIncomeTaxSavings - paidCapGainsOnSale; 
  const liquidateNetCost = donationAmount - liquidateNetTaxSavings;

  return {
    cash: {
      donationAmount,
      incomeTaxSavings: cashIncomeTaxSavings,
      capGainsSavings: 0,
      totalSavings: cashIncomeTaxSavings,
      netCost: cashNetCost,
      amountToCharity: donationAmount
    },
    stock: {
      donationAmount,
      incomeTaxSavings: stockIncomeTaxSavings,
      capGainsSavings: stockCapGainsSaved,
      totalSavings: stockTotalSavings,
      netCost: stockNetCost,
      amountToCharity: donationAmount
    },
    liquidateFirst: {
      donationAmount,
      taxPaid: paidCapGainsOnSale,
      amountToCharity: cashLeftToDonate,
      incomeTaxSavings: liquidateIncomeTaxSavings,
      totalSavings: liquidateIncomeTaxSavings - paidCapGainsOnSale,
      netCost: liquidateNetCost
    },
    stockBenefitVsCash: cashNetCost - stockNetCost,
    stockBenefitVsLiquidating: donationAmount - cashLeftToDonate
  };
}
