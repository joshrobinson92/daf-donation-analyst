// DAF Donation Analyst - Core App Logic

import {
  CAUSE_CATEGORIES,
  MOCK_CHARITIES,
  INVESTMENT_PORTFOLIOS,
  STRATEGY_PRESETS
} from './data.js';

import {
  calculateProjections,
  calculateTaxSavings
} from './calculator.js';

import {
  renderProjectionChart,
  renderDonutChart,
  formatCurrencyCompact,
  formatCurrencyFull
} from './charts.js';

// --- STATE MANAGEMENT ---
let appState = {
  // Plan Parameters
  originalBalance: 250000, // Tracks the slider baseline value
  balance: 250000,         // Simulated start balance (baseline minus recommended grants)
  annualContribution: 10000,
  growthRate: 8.5,
  grantType: 'percent',    // 'percent' or 'fixed'
  grantValue: 5,           // 5% or $15000
  years: 25,
  portfolioId: 'aggressive-growth',

  // Allocations
  causeAllocations: {
    environment: 30,
    education: 20,
    health: 20,
    humanitarian: 20,
    arts: 10
  },

  // Recommended Grants
  recommendedGrants: [],

  // Every.org API parameters
  everyOrgApiKey: '',
  selectedLiveCharity: null, // Temporary cache for recommending grants from live search results

  // Tax Optimizer Parameters
  taxDonation: 50000,
  taxBasisPercent: 30,
  taxOrdinaryRate: 37,
  taxCapGainsRate: 20,

  // Selected charity for modal
  selectedCharityId: null
};

// --- DOM ELEMENTS ---
const elements = {
  // Navigation
  navHome: document.getElementById('nav-home'),
  navInvest: document.getElementById('nav-invest'),
  navNonprofits: document.getElementById('nav-nonprofits'),
  forecasterPresets: document.getElementById('forecaster-presets'),

  // Page Views
  viewHome: document.getElementById('view-home'),
  viewInvest: document.getElementById('view-invest'),
  viewNonprofits: document.getElementById('view-nonprofits'),

  // Preset Select
  strategyPresetSelect: document.getElementById('strategy-preset-select'),
  resetBtn: document.getElementById('reset-btn'),

  // Hero Metrics
  metricFinalBalance: document.getElementById('metric-final-balance'),
  metricTotalGrants: document.getElementById('metric-total-grants'),
  metricNetCost: document.getElementById('metric-net-cost'),
  metricMultiplier: document.getElementById('metric-multiplier'),
  metricFinalBalanceSub: document.getElementById('metric-final-balance-sub'),
  metricTotalGrantsSub: document.getElementById('metric-total-grants-sub'),
  metricNetCostSub: document.getElementById('metric-net-cost-sub'),
  metricMultiplierSub: document.getElementById('metric-multiplier-sub'),

  // Parameters Inputs
  inputStartBalance: document.getElementById('input-start-balance'),
  valueStartBalance: document.getElementById('value-start-balance'),
  inputAnnualContribution: document.getElementById('input-annual-contribution'),
  valueAnnualContribution: document.getElementById('value-annual-contribution'),
  inputPortfolio: document.getElementById('input-portfolio'),
  portfolioDesc: document.getElementById('portfolio-desc'),
  inputGrowthRate: document.getElementById('input-growth-rate'),
  valueGrowthRate: document.getElementById('value-growth-rate'),
  toggleGrantPercent: document.getElementById('toggle-grant-percent'),
  toggleGrantFixed: document.getElementById('toggle-grant-fixed'),
  labelGrantValue: document.getElementById('label-grant-value'),
  inputGrantValue: document.getElementById('input-grant-value'),
  valueGrantValue: document.getElementById('value-grant-value'),
  inputTimeline: document.getElementById('input-timeline'),
  valueTimeline: document.getElementById('value-timeline'),

  // Allocation elements
  causeSlidersList: document.getElementById('cause-sliders-list'),
  allocationWarning: document.getElementById('allocation-warning'),
  allocationSum: document.getElementById('allocation-sum'),
  rebalanceBtn: document.getElementById('rebalance-btn'),

  // Every.org API Configuration Bar
  everyorgApiKeyInput: document.getElementById('everyorg-api-key-input'),
  apiStatusBadge: document.getElementById('api-status-badge'),
  apiStatusText: document.getElementById('api-status-text'),

  // Charity Search and list
  charitySearchInput: document.getElementById('charity-search-input'),
  charityFilterSelect: document.getElementById('charity-filter-select'),
  charitiesContainer: document.getElementById('charities-container'),
  searchLoading: document.getElementById('search-loading'),

  // Recommended Basket elements
  basketEmptyMessage: document.getElementById('basket-empty-message'),
  basketItemsContainer: document.getElementById('basket-items-container'),

  // Tax Optimizer Inputs
  inputTaxDonation: document.getElementById('input-tax-donation'),
  inputTaxBasis: document.getElementById('input-tax-basis'),
  valueTaxBasis: document.getElementById('value-tax-basis'),
  inputTaxOrdinary: document.getElementById('input-tax-ordinary'),
  inputTaxGains: document.getElementById('input-tax-gains'),

  // Tax Results Columns
  taxCashNetCost: document.getElementById('tax-cash-net-cost'),
  taxCashPayout: document.getElementById('tax-cash-payout'),
  taxCashIncomeSave: document.getElementById('tax-cash-income-save'),
  taxStockNetCost: document.getElementById('tax-stock-net-cost'),
  taxStockPayout: document.getElementById('tax-stock-payout'),
  taxStockIncomeSave: document.getElementById('tax-stock-income-save'),
  taxStockGainsSave: document.getElementById('tax-stock-gains-save'),
  taxSavingsSummaryBanner: document.getElementById('tax-savings-summary-banner'),

  // Dialog / Modal Elements
  charityDialog: document.getElementById('charity-dialog'),
  dialogTitle: document.getElementById('charity-dialog-title'),
  dialogContent: document.getElementById('dialog-content'),
  dialogGrantAmount: document.getElementById('dialog-grant-amount'),
  dialogGrantForm: document.getElementById('dialog-grant-form'),
  dialogCloseBtn: document.getElementById('charity-dialog-close-btn'),
  dialogCancelBtn: document.getElementById('charity-dialog-cancel-btn'),
  chartTooltip: document.getElementById('chart-tooltip')
};

// --- INITIALIZATION ---
function init() {
  // Populate Investment Portfolio Options
  INVESTMENT_PORTFOLIOS.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    elements.inputPortfolio.appendChild(option);
  });

  // Render Cause Allocation Sliders
  renderCauseSliders();

  // Load Every.org API Key from localStorage
  const savedKey = localStorage.getItem('everyorg_apikey');
  if (savedKey) {
    appState.everyOrgApiKey = savedKey;
    if (elements.everyorgApiKeyInput) {
      elements.everyorgApiKeyInput.value = savedKey;
    }
  }

  // Attach Event Listeners
  setupEventListeners();

  // Initialize status badge
  updateApiStatusBadge(!!appState.everyOrgApiKey);

  // Set up client-side hash router
  router();

  // Load Preset Defaults (Perpetual Endowment)
  applyPreset('endowment');

  // Initial calculation and chart rendering
  updateAllCalculations();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Hash change router listener
  window.addEventListener('hashchange', router);

  // Presets
  elements.strategyPresetSelect.addEventListener('change', (e) => {
    if (e.target.value !== 'custom') {
      applyPreset(e.target.value);
    }
  });

  elements.resetBtn.addEventListener('click', () => {
    applyPreset('endowment');
  });

  // Parameter Inputs (Dynamic updating on slide)
  elements.inputStartBalance.addEventListener('input', (e) => {
    appState.originalBalance = parseInt(e.target.value, 10);
    appState.balance = Math.max(0, appState.originalBalance - getBasketTotal());
    elements.valueStartBalance.textContent = formatCurrencyFull(appState.originalBalance);
    setCustomPreset();
    updateAllCalculations();
  });

  elements.inputAnnualContribution.addEventListener('input', (e) => {
    appState.annualContribution = parseInt(e.target.value, 10);
    elements.valueAnnualContribution.textContent = formatCurrencyFull(appState.annualContribution);
    setCustomPreset();
    updateAllCalculations();
  });

  elements.inputPortfolio.addEventListener('change', (e) => {
    appState.portfolioId = e.target.value;
    const portfolio = INVESTMENT_PORTFOLIOS.find(p => p.id === appState.portfolioId);
    if (portfolio) {
      elements.portfolioDesc.textContent = `${portfolio.description} (Allocations: ${portfolio.allocation.map(a => `${a.asset} ${a.percent}%`).join(', ')})`;
      
      // Update expected return slider & value
      appState.growthRate = portfolio.expectedReturn;
      elements.inputGrowthRate.value = appState.growthRate;
      elements.valueGrowthRate.textContent = `${appState.growthRate.toFixed(1)}%`;
    }
    setCustomPreset();
    updateAllCalculations();
  });

  elements.inputGrowthRate.addEventListener('input', (e) => {
    appState.growthRate = parseFloat(e.target.value);
    elements.valueGrowthRate.textContent = `${appState.growthRate.toFixed(1)}%`;
    elements.inputPortfolio.value = 'custom';
    elements.portfolioDesc.textContent = 'Custom return projection (portfolio mix not modeled).';
    setCustomPreset();
    updateAllCalculations();
  });

  // Grant Payout Method Toggle
  elements.toggleGrantPercent.addEventListener('click', () => {
    setGrantMethod('percent');
  });

  elements.toggleGrantFixed.addEventListener('click', () => {
    setGrantMethod('fixed');
  });

  elements.inputGrantValue.addEventListener('input', (e) => {
    appState.grantValue = parseFloat(e.target.value);
    if (appState.grantType === 'percent') {
      elements.valueGrantValue.textContent = `${appState.grantValue}%`;
    } else {
      elements.valueGrantValue.textContent = formatCurrencyFull(appState.grantValue);
    }
    setCustomPreset();
    updateAllCalculations();
  });

  elements.inputTimeline.addEventListener('input', (e) => {
    appState.years = parseInt(e.target.value, 10);
    elements.valueTimeline.textContent = `${appState.years} Years`;
    setCustomPreset();
    updateAllCalculations();
  });

  // Rebalance Button
  elements.rebalanceBtn.addEventListener('click', () => {
    rebalanceAllocations();
  });

  // Charity filter and search
  elements.charityFilterSelect.addEventListener('change', () => {
    renderCharities();
  });

  let searchDebounceTimeout = null;
  elements.charitySearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      renderCharities();
    }, 300);
  });

  // Every.org API Key Input listener
  elements.everyorgApiKeyInput.addEventListener('input', (e) => {
    const key = e.target.value.trim();
    appState.everyOrgApiKey = key;
    localStorage.setItem('everyorg_apikey', key);
    updateApiStatusBadge(!!key);
    renderCharities();
  });

  // Tax Optimizer Inputs
  elements.inputTaxDonation.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      appState.taxDonation = val;
      updateTaxCalculations();
    }
  });

  elements.inputTaxBasis.addEventListener('input', (e) => {
    appState.taxBasisPercent = parseInt(e.target.value, 10);
    elements.valueTaxBasis.textContent = `${appState.taxBasisPercent}%`;
    updateTaxCalculations();
  });

  elements.inputTaxOrdinary.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      appState.taxOrdinaryRate = val;
      updateTaxCalculations();
      updateAllCalculations(); // Updates the net cost and multiplier of DAF simulations
    }
  });

  elements.inputTaxGains.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      appState.taxCapGainsRate = val;
      updateTaxCalculations();
      updateAllCalculations(); // Updates the net cost and multiplier of DAF simulations
    }
  });

  // Modals & Dialog closing handlers
  elements.dialogCloseBtn.addEventListener('click', () => {
    elements.charityDialog.close();
  });

  elements.dialogCancelBtn.addEventListener('click', () => {
    elements.charityDialog.close();
  });

  // Form submission recommendation handler
  elements.dialogGrantForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const grantAmount = parseInt(elements.dialogGrantAmount.value, 10);
    
    if (appState.selectedCharityId && grantAmount > 0) {
      addGrantToBasket(appState.selectedCharityId, grantAmount);
      elements.charityDialog.close();
    }
  });

  // Native Dialog Light dismiss fallback for older Safari browsers
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    elements.charityDialog.addEventListener('click', (event) => {
      if (event.target !== elements.charityDialog) return;
      const rect = elements.charityDialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        elements.charityDialog.close();
      }
    });
  }
}

// --- CORE LOGIC ACTIONS ---

function applyPreset(presetId) {
  const preset = STRATEGY_PRESETS.find(p => p.id === presetId);
  if (!preset) return;

  appState.balance = preset.balance;
  appState.annualContribution = preset.annualContribution;
  appState.growthRate = preset.growthRate || 0; // Temp placeholder, loaded from portfolio below
  appState.years = preset.years;
  appState.portfolioId = preset.portfolioId;

  // Locate portfolio return
  const portfolio = INVESTMENT_PORTFOLIOS.find(p => p.id === preset.portfolioId);
  if (portfolio) {
    appState.growthRate = portfolio.expectedReturn;
    elements.inputPortfolio.value = portfolio.id;
    elements.portfolioDesc.textContent = `${portfolio.description} (Allocations: ${portfolio.allocation.map(a => `${a.asset} ${a.percent}%`).join(', ')})`;
  }

  // Set grant variables
  setGrantMethod(presetId === 'sunset-fund' ? 'percent' : 'percent', preset.grantPercent);
  
  if (presetId === 'sunset-fund') {
    appState.grantType = 'percent';
    appState.grantValue = preset.grantPercent;
  } else {
    appState.grantType = 'percent';
    appState.grantValue = preset.grantPercent;
  }

  // Update slide/input element values
  elements.inputStartBalance.value = appState.balance;
  elements.valueStartBalance.textContent = formatCurrencyFull(appState.balance);

  elements.inputAnnualContribution.value = appState.annualContribution;
  elements.valueAnnualContribution.textContent = formatCurrencyFull(appState.annualContribution);

  elements.inputGrowthRate.value = appState.growthRate;
  elements.valueGrowthRate.textContent = `${appState.growthRate.toFixed(1)}%`;

  elements.inputTimeline.value = appState.years;
  elements.valueTimeline.textContent = `${appState.years} Years`;

  elements.strategyPresetSelect.value = presetId;

  updateAllCalculations();
}

function setCustomPreset() {
  elements.strategyPresetSelect.value = 'custom';
}

function setGrantMethod(method, valueOverride = null) {
  appState.grantType = method;
  
  if (method === 'percent') {
    elements.toggleGrantPercent.classList.add('active');
    elements.toggleGrantFixed.classList.remove('active');
    elements.labelGrantValue.textContent = 'Annual Payout Rate';
    
    // Set slider boundaries
    elements.inputGrantValue.min = 1;
    elements.inputGrantValue.max = 50;
    elements.inputGrantValue.step = 1;
    
    // Determine target value
    appState.grantValue = valueOverride !== null ? valueOverride : 5;
    elements.inputGrantValue.value = appState.grantValue;
    elements.valueGrantValue.textContent = `${appState.grantValue}%`;
  } else {
    elements.toggleGrantPercent.classList.remove('active');
    elements.toggleGrantFixed.classList.add('active');
    elements.labelGrantValue.textContent = 'Annual Payout Amount';
    
    // Set slider boundaries
    elements.inputGrantValue.min = 5000;
    elements.inputGrantValue.max = 250000;
    elements.inputGrantValue.step = 5000;
    
    // Determine target value
    appState.grantValue = valueOverride !== null ? valueOverride : 15000;
    elements.inputGrantValue.value = appState.grantValue;
    elements.valueGrantValue.textContent = formatCurrencyFull(appState.grantValue);
  }
  
  setCustomPreset();
  updateAllCalculations();
}

// --- CALCULATIONS & RENDERING ---

function updateAllCalculations() {
  // 1. Calculate projections
  const projections = calculateProjections({
    initialBalance: appState.balance,
    annualContribution: appState.annualContribution,
    grantType: appState.grantType,
    grantValue: appState.grantValue,
    annualGrowthRate: appState.growthRate,
    years: appState.years
  });

  const finalYearData = projections[projections.length - 1];

  // 2. Compute Net Out of Pocket cost based on tax ordinary rate
  // Net Cost = Initial balance * (1 - ordTax/100) + Sum(annualContribution * (1 - ordTax/100))
  const ordTaxMult = appState.taxOrdinaryRate / 100;
  const initialNetCost = appState.balance * (1 - ordTaxMult);
  const annualContribNetCost = (appState.annualContribution * appState.years) * (1 - ordTaxMult);
  const totalNetCost = initialNetCost + annualContribNetCost;

  // 3. Giving Multiplier
  const multiplier = totalNetCost > 0 ? (finalYearData.cumulativeGrants / totalNetCost) : 0;

  // 4. Update Hero Metrics Cards in DOM
  elements.metricFinalBalance.textContent = formatCurrencyFull(finalYearData.endBalance);
  elements.metricTotalGrants.textContent = formatCurrencyFull(finalYearData.cumulativeGrants);
  elements.metricNetCost.textContent = formatCurrencyFull(totalNetCost);
  elements.metricMultiplier.textContent = `${multiplier.toFixed(1)}x`;

  // Update metric labels
  elements.metricFinalBalanceSub.textContent = `Value in Year ${appState.years}`;
  elements.metricTotalGrantsSub.textContent = `Total over ${appState.years} years`;
  elements.metricNetCostSub.textContent = `For $${Math.round(appState.balance + appState.annualContribution * appState.years).toLocaleString()} total contributed`;
  elements.metricMultiplierSub.textContent = `${multiplier.toFixed(1)}x charitable impact per net cost`;

  // 5. Render Projection SVG Chart
  renderProjectionChart(
    'projection-chart-container',
    projections,
    handleChartHover,
    handleChartLeave
  );

  // 6. Donut Allocation update
  updateAllocationDonut();

  // 7. Charity directory update
  renderCharities();

  // 8. Tax Optimization panel update
  updateTaxCalculations();
}

function updateTaxCalculations() {
  const taxResults = calculateTaxSavings({
    donationAmount: appState.taxDonation,
    costBasisPercent: appState.taxBasisPercent,
    ordinaryTaxRate: appState.taxOrdinaryRate,
    capGainsTaxRate: appState.taxCapGainsRate
  });

  // Update Cash Column
  elements.taxCashNetCost.textContent = formatCurrencyFull(taxResults.cash.netCost);
  elements.taxCashPayout.textContent = formatCurrencyFull(taxResults.cash.amountToCharity);
  elements.taxCashIncomeSave.textContent = formatCurrencyFull(taxResults.cash.incomeTaxSavings);

  // Update Stock Column
  elements.taxStockNetCost.textContent = formatCurrencyFull(taxResults.stock.netCost);
  elements.taxStockPayout.textContent = formatCurrencyFull(taxResults.stock.amountToCharity);
  elements.taxStockIncomeSave.textContent = formatCurrencyFull(taxResults.stock.incomeTaxSavings);
  elements.taxStockGainsSave.textContent = formatCurrencyFull(taxResults.stock.capGainsSavings);

  // Update Banner text
  elements.taxSavingsSummaryBanner.innerHTML = `
    ✨ Stock donation saves an extra <strong>${formatCurrencyFull(taxResults.stockCapGainsSaved)}</strong> in Capital Gains tax compared to cash. 
    Net cost to you: <strong>${formatCurrencyFull(taxResults.stock.netCost)}</strong> to give <strong>${formatCurrencyFull(taxResults.taxDonation)}</strong>.
  `;
}

// --- ALLOCATIONS MANAGEMENT ---

function renderCauseSliders() {
  elements.causeSlidersList.innerHTML = '';
  
  Object.keys(CAUSE_CATEGORIES).forEach(key => {
    const cause = CAUSE_CATEGORIES[key];
    const initialPercent = appState.causeAllocations[key];

    const item = document.createElement('div');
    item.className = 'alloc-item';
    item.innerHTML = `
      <div class="alloc-icon" style="color: ${cause.color}">${cause.icon}</div>
      <div class="alloc-details">
        <span class="alloc-name">${cause.name}</span>
        <span class="alloc-desc">${cause.description}</span>
      </div>
      <div class="alloc-control">
        <input type="range" class="alloc-slider" id="alloc-slider-${key}" min="0" max="100" step="5" value="${initialPercent}">
        <span class="alloc-percent" id="alloc-percent-${key}">${initialPercent}%</span>
      </div>
    `;

    elements.causeSlidersList.appendChild(item);

    // Bind event
    const slider = item.querySelector(`#alloc-slider-${key}`);
    const percentLabel = item.querySelector(`#alloc-percent-${key}`);

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.causeAllocations[key] = val;
      percentLabel.textContent = `${val}%`;
      validateAllocations();
      updateAllocationDonut();
    });
  });
}

function validateAllocations() {
  const sum = Object.values(appState.causeAllocations).reduce((acc, curr) => acc + curr, 0);
  elements.allocationSum.textContent = `${sum}%`;
  
  if (sum !== 100) {
    elements.allocationWarning.style.display = 'block';
    elements.rebalanceBtn.style.display = 'inline-flex';
    
    // Highlight error
    elements.allocationWarning.className = 'allocation-warning';
    elements.allocationSum.style.color = 'var(--color-warning)';
  } else {
    elements.allocationWarning.style.display = 'none';
    elements.rebalanceBtn.style.display = 'none';
  }
}

function rebalanceAllocations() {
  const keys = Object.keys(appState.causeAllocations);
  const values = keys.map(k => appState.causeAllocations[k]);
  const sum = values.reduce((acc, curr) => acc + curr, 0);

  if (sum === 0) {
    // Equal distribution if everything was 0
    const equalVal = Math.floor(100 / keys.length);
    keys.forEach(k => {
      appState.causeAllocations[k] = equalVal;
    });
    // Fix rounding
    appState.causeAllocations[keys[0]] += (100 - equalVal * keys.length);
  } else {
    // Proportional rebalancing
    let runningSum = 0;
    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) {
        // Last one gets the remainder to avoid rounding issues
        appState.causeAllocations[k] = 100 - runningSum;
      } else {
        const normalized = Math.round((appState.causeAllocations[k] / sum) * 100);
        appState.causeAllocations[k] = normalized;
        runningSum += normalized;
      }
    });
  }

  // Update DOM values
  keys.forEach(k => {
    const slider = document.getElementById(`alloc-slider-${k}`);
    const percent = document.getElementById(`alloc-percent-${k}`);
    if (slider) slider.value = appState.causeAllocations[k];
    if (percent) percent.textContent = `${appState.causeAllocations[k]}%`;
  });

  validateAllocations();
  updateAllocationDonut();
}

function updateAllocationDonut() {
  const donutData = Object.keys(appState.causeAllocations).map(key => {
    return {
      label: CAUSE_CATEGORIES[key].name,
      percent: appState.causeAllocations[key],
      color: CAUSE_CATEGORIES[key].color
    };
  });

  renderDonutChart('donut-chart-container', donutData);
}

// --- CHARITY RESEARCH & MODAL ACTIONS ---

// Every.org Category mapping table
const CATEGORY_MAP = {
  environment: 'environment,climate',
  education: 'education',
  health: 'health,medicine',
  humanitarian: 'poverty,justice',
  arts: 'arts,culture'
};

function renderCharities() {
  const filter = elements.charityFilterSelect.value;
  const searchVal = (elements.charitySearchInput.value || '').toLowerCase().trim();

  // If Every.org API Key is set, fetch from API
  if (appState.everyOrgApiKey) {
    if (elements.searchLoading) elements.searchLoading.style.display = 'flex';
    elements.charitiesContainer.innerHTML = '';

    const query = searchVal || 'nonprofit';
    let url = `https://partners.every.org/v0.2/search/${encodeURIComponent(query)}?apiKey=${appState.everyOrgApiKey}&take=20`;
    
    if (filter !== 'all') {
      url += `&causes=${CATEGORY_MAP[filter]}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('API Request Failed');
        return res.json();
      })
      .then(data => {
        if (elements.searchLoading) elements.searchLoading.style.display = 'none';
        
        // Cache the live results array so we can open details dialog later
        appState.liveCharitiesCache = data.nonprofits || [];
        renderLiveNonprofits(appState.liveCharitiesCache);
      })
      .catch(err => {
        console.error(err);
        if (elements.searchLoading) elements.searchLoading.style.display = 'none';
        elements.charitiesContainer.innerHTML = `
          <div style="text-align:center; padding: 2.5rem 1rem; color: var(--color-warning); font-size: 0.85rem;">
            ⚠️ Error loading live results. Please check your API key or network connection.
          </div>`;
      });
  } else {
    // FALLBACK: Filter local static MOCK_CHARITIES database
    if (elements.searchLoading) elements.searchLoading.style.display = 'none';
    elements.charitiesContainer.innerHTML = '';

    const filteredCharities = MOCK_CHARITIES.filter(c => {
      const matchesCategory = filter === 'all' || c.category === filter;
      const matchesSearch = c.name.toLowerCase().includes(searchVal) || c.description.toLowerCase().includes(searchVal);
      return matchesCategory && matchesSearch;
    });

    if (filteredCharities.length === 0) {
      elements.charitiesContainer.innerHTML = `
        <div style="text-align:center; padding: 2.5rem 1rem; color: var(--color-text-dim); font-size: 0.85rem;">
          No matching local high-impact charities found.
        </div>`;
      return;
    }

    filteredCharities.forEach(c => {
      const cause = CAUSE_CATEGORIES[c.category];
      const card = document.createElement('div');
      card.className = 'charity-card';
      card.role = 'listitem';
      card.innerHTML = `
        <div class="charity-info">
          <div class="charity-tag-row">
            <span class="charity-tag" style="background-color: ${cause.color}15; color: ${cause.color}">
              ${cause.icon} ${cause.name}
            </span>
          </div>
          <div class="charity-name">${c.name}</div>
          <div class="charity-desc">${c.description}</div>
        </div>
        <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
          <span class="charity-metric">${c.metric}</span>
          <button class="btn btn-sm btn-primary recommend-btn" data-id="${c.id}">
            Recommend Grant
          </button>
        </div>
      `;

      // Hook click
      const btn = card.querySelector('.recommend-btn');
      btn.addEventListener('click', () => openCharityDialog(c.id, false));

      elements.charitiesContainer.appendChild(card);
    });
  }
}

function renderLiveNonprofits(nonprofits) {
  elements.charitiesContainer.innerHTML = '';

  if (nonprofits.length === 0) {
    elements.charitiesContainer.innerHTML = `
      <div style="text-align:center; padding: 2.5rem 1rem; color: var(--color-text-dim); font-size: 0.85rem;">
        No results found on Every.org. Try adjusting your query.
      </div>`;
    return;
  }

  nonprofits.forEach(c => {
    const card = document.createElement('div');
    card.className = 'charity-card';
    card.role = 'listitem';
    
    // Fallback display values
    const description = c.description || 'No description provided by organization.';
    const location = c.location || 'United States';
    const tagLabel = '501(c)(3) Nonprofit';

    card.innerHTML = `
      <div class="charity-info">
        <div class="charity-tag-row">
          <span class="charity-tag" style="background-color: var(--color-primary-glow); color: var(--color-primary)">
            🏛️ ${tagLabel}
          </span>
        </div>
        <div class="charity-name">${c.name}</div>
        <div class="charity-desc">${description}</div>
      </div>
      <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
        <span class="charity-metric" style="color: var(--color-text-muted); font-weight: normal;">📍 ${location}</span>
        <button class="btn btn-sm btn-primary recommend-btn" data-slug="${c.slug}">
          Recommend Grant
        </button>
      </div>
    `;

    // Hook click
    const btn = card.querySelector('.recommend-btn');
    btn.addEventListener('click', () => openCharityDialog(c.slug, true));

    elements.charitiesContainer.appendChild(card);
  });
}

function openCharityDialog(id, isLiveSearch) {
  let name, description, websiteUrl, location, displayMetric, detailsHtml;
  
  if (isLiveSearch) {
    const charity = (appState.liveCharitiesCache || []).find(c => c.slug === id);
    if (!charity) return;

    appState.selectedCharityId = charity.slug;
    appState.selectedLiveCharity = charity; // cache details

    name = charity.name;
    description = charity.description || 'No description provided by organization.';
    websiteUrl = charity.websiteUrl || charity.profileUrl;
    location = charity.location || 'United States';
    displayMetric = 'Tax-deductible public charity registered under IRC section 501(c)(3).';

    detailsHtml = `
      <div style="margin-bottom: 1rem;">
        <span class="charity-tag" style="background-color: var(--color-primary-glow); color: var(--color-primary); font-size: 0.75rem; font-weight:700; text-transform:uppercase;">
          🏛️ 501(c)(3) Nonprofit
        </span>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #ffffff;">${description}</p>
        <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 0.5rem; border:1px dashed var(--color-primary);">
          <span style="font-size:0.75rem; color:var(--color-text-muted);">Nonprofit Verification:</span>
          <div style="font-size:0.85rem; font-weight:600; color:var(--color-accent); margin-top:0.125rem;">${displayMetric}</div>
          <div style="font-size:0.75rem; color:var(--color-text-dim); margin-top:0.25rem;">📍 Location: ${location}</div>
        </div>
        ${websiteUrl ? `
        <p style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--color-text-muted);">
          Charity Link: <a href="${websiteUrl}" target="_blank" style="color: var(--color-primary); text-decoration:none;">${websiteUrl.replace(/https?:\/\/(www\.)?/, '')} ↗</a>
        </p>
        ` : ''}
      </div>
    `;
  } else {
    const charity = MOCK_CHARITIES.find(c => c.id === id);
    if (!charity) return;

    appState.selectedCharityId = charity.id;
    appState.selectedLiveCharity = null;
    const cause = CAUSE_CATEGORIES[charity.category];

    name = charity.name;
    description = charity.description;
    websiteUrl = `https://${charity.website}`;
    displayMetric = charity.metric;

    detailsHtml = `
      <div style="margin-bottom: 1rem;">
        <span class="charity-tag" style="background-color: ${cause.color}15; color: ${cause.color}; font-size: 0.75rem; font-weight:700; text-transform:uppercase;">
          ${cause.icon} ${cause.name}
        </span>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #ffffff;">${description}</p>
        <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 0.5rem; border:1px dashed ${cause.color}30;">
          <span style="font-size:0.75rem; color:var(--color-text-muted);">Impact Efficiency Metric:</span>
          <div style="font-size:0.95rem; font-weight:700; color:var(--color-warning); margin-top:0.125rem;">${displayMetric}</div>
        </div>
        <p style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--color-text-muted);">
          Charity URL: <a href="${websiteUrl}" target="_blank" style="color: var(--color-primary); text-decoration:none;">${charity.website} ↗</a>
        </p>
      </div>
    `;
  }

  elements.dialogTitle.textContent = `Recommend Grant: ${name}`;
  elements.dialogContent.innerHTML = detailsHtml;

  // Prefill a default recommendation amount equal to a portion of the projected annual payout
  const projections = calculateProjections({
    initialBalance: appState.balance,
    annualContribution: appState.annualContribution,
    grantType: appState.grantType,
    grantValue: appState.grantValue,
    annualGrowthRate: appState.growthRate,
    years: appState.years
  });
  const firstYearPayout = projections[1] ? projections[1].grantPaid : 5000;
  const suggestion = Math.max(100, Math.round((firstYearPayout / 4) / 100) * 100);

  elements.dialogGrantAmount.value = suggestion;
  elements.dialogGrantAmount.max = appState.balance;

  // Open modal
  elements.charityDialog.showModal();
}

// --- CHART INTERACTIVE HOVER TOOLTIP ---

function handleChartHover(yearData, clientX, clientY) {
  const tooltip = elements.chartTooltip;
  tooltip.style.display = 'block';
  tooltip.style.left = `${clientX + 15}px`;
  tooltip.style.top = `${clientY - 40}px`;

  tooltip.innerHTML = `
    <div class="tooltip-title">Year ${yearData.year} Projections</div>
    <div class="tooltip-row">
      <span class="label">DAF Balance:</span>
      <span class="val bal">${formatCurrencyFull(yearData.endBalance)}</span>
    </div>
    <div class="tooltip-row">
      <span class="label">Annual Grant:</span>
      <span class="val gr">${formatCurrencyFull(yearData.grantPaid)}</span>
    </div>
    <div class="tooltip-row">
      <span class="label">Growth Earned:</span>
      <span class="val">+${formatCurrencyFull(yearData.growth)}</span>
    </div>
    <div class="tooltip-row" style="margin-top: 0.25rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.25rem;">
      <span class="label">Total Granted:</span>
      <span class="val gr" style="font-weight:700;">${formatCurrencyFull(yearData.cumulativeGrants)}</span>
    </div>
  `;
}

function handleChartLeave() {
  elements.chartTooltip.style.display = 'none';
}

// --- CLIENT-SIDE ROUTER ---

function router() {
  const hash = window.location.hash || '#home';
  
  const tabs = [elements.navHome, elements.navInvest, elements.navNonprofits];
  const views = [elements.viewHome, elements.viewInvest, elements.viewNonprofits];
  
  tabs.forEach(t => {
    if (t) t.classList.remove('active');
  });
  views.forEach(v => {
    if (v) v.classList.remove('active');
  });

  // Hide strategy controls by default
  if (elements.forecasterPresets) {
    elements.forecasterPresets.style.display = 'none';
  }

  if (hash === '#home') {
    if (elements.navHome) elements.navHome.classList.add('active');
    if (elements.viewHome) elements.viewHome.classList.add('active');
  } else if (hash === '#invest') {
    if (elements.navInvest) elements.navInvest.classList.add('active');
    if (elements.viewInvest) elements.viewInvest.classList.add('active');
    if (elements.forecasterPresets) elements.forecasterPresets.style.display = 'inline-flex';
    
    // Force chart re-draw on view switch
    setTimeout(() => {
      updateAllCalculations();
    }, 50);
  } else if (hash === '#nonprofits') {
    if (elements.navNonprofits) elements.navNonprofits.classList.add('active');
    if (elements.viewNonprofits) elements.viewNonprofits.classList.add('active');
    
    // Re-draw donut and refresh directory list
    setTimeout(() => {
      updateAllocationDonut();
      renderCharities();
      renderBasketItems();
    }, 50);
  }
}

// --- RECOMMENDED GIVING BASKET MANAGEMENT ---

function getBasketTotal() {
  return appState.recommendedGrants.reduce((acc, curr) => acc + curr.amount, 0);
}

function addGrantToBasket(charityId, amount) {
  let name = '';
  
  if (appState.selectedLiveCharity && appState.selectedLiveCharity.slug === charityId) {
    name = appState.selectedLiveCharity.name;
  } else {
    const charity = MOCK_CHARITIES.find(c => c.id === charityId);
    if (!charity) return;
    name = charity.name;
  }

  appState.recommendedGrants.push({
    id: Date.now().toString(),
    charityId,
    name,
    amount
  });

  // Dynamically update DAF simulated starting balance
  appState.balance = Math.max(0, appState.originalBalance - getBasketTotal());
  elements.inputStartBalance.value = appState.balance;
  
  updateAllCalculations();
  renderBasketItems();
}

function deleteGrantFromBasket(grantId) {
  appState.recommendedGrants = appState.recommendedGrants.filter(g => g.id !== grantId);
  
  // Dynamically update DAF simulated starting balance
  appState.balance = Math.max(0, appState.originalBalance - getBasketTotal());
  elements.inputStartBalance.value = appState.balance;
  
  updateAllCalculations();
  renderBasketItems();
}

function renderBasketItems() {
  elements.basketItemsContainer.innerHTML = '';
  
  if (appState.recommendedGrants.length === 0) {
    elements.basketEmptyMessage.style.display = 'block';
    return;
  }
  
  elements.basketEmptyMessage.style.display = 'none';

  appState.recommendedGrants.forEach(g => {
    const item = document.createElement('div');
    item.className = 'basket-item';
    item.innerHTML = `
      <div class="basket-item-info">
        <span class="basket-item-name">${g.name}</span>
        <span class="basket-item-val">${formatCurrencyFull(g.amount)}</span>
      </div>
      <button class="basket-item-delete" data-id="${g.id}" aria-label="Delete recommended grant">✕</button>
    `;
    
    // Bind delete click
    item.querySelector('.basket-item-delete').addEventListener('click', () => {
      deleteGrantFromBasket(g.id);
    });

    elements.basketItemsContainer.appendChild(item);
  });
}

// Every.org Status Badge Helper
function updateApiStatusBadge(isActive) {
  if (!elements.apiStatusBadge || !elements.apiStatusText) return;
  const dot = elements.apiStatusBadge.querySelector('.badge-dot');
  
  if (isActive) {
    if (dot) dot.className = 'badge-dot active';
    elements.apiStatusText.textContent = 'Live Search Active';
  } else {
    if (dot) dot.className = 'badge-dot fallback';
    elements.apiStatusText.textContent = 'Local Fallback Active';
  }
}

// Start application
window.addEventListener('DOMContentLoaded', init);
