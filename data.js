// DAF Donation Analyst - Mock Data

export const CAUSE_CATEGORIES = {
  environment: {
    id: 'environment',
    name: 'Environment & Climate',
    color: '#10b981', // Emerald
    icon: '🌱',
    description: 'Combating climate change, preserving ecosystems, and transitioning to clean energy.'
  },
  education: {
    id: 'education',
    name: 'Education Access',
    color: '#3b82f6', // Blue
    icon: '🎓',
    description: 'Providing scholarships, funding under-resourced schools, and expanding literacy.'
  },
  health: {
    id: 'health',
    name: 'Global Health',
    color: '#ef4444', // Red
    icon: '❤️',
    description: 'Distributing vaccines, preventing pandemics, and curing infectious diseases.'
  },
  humanitarian: {
    id: 'humanitarian',
    name: 'Poverty & Humanitarian Relief',
    color: '#f59e0b', // Amber
    icon: '🤝',
    description: 'Providing direct cash transfers, clean water, food security, and disaster aid.'
  },
  arts: {
    id: 'arts',
    name: 'Arts & Culture',
    color: '#8b5cf6', // Violet
    icon: '🎨',
    description: 'Supporting local museums, public broadcasting, and community theater.'
  }
};

export const MOCK_CHARITIES = [
  // Environment
  {
    id: 'clean-air-task-force',
    category: 'environment',
    name: 'Clean Air Task Force',
    description: 'Researching and advocating for low-carbon energy technologies and climate policy.',
    metric: '$1.20 to avoid 1 ton of CO2 equivalent',
    website: 'catf.us'
  },
  {
    id: 'rainforest-coalition',
    category: 'environment',
    name: 'Coalition for Rainforest Nations',
    description: 'Empowering tropical nations to protect forests and reduce carbon emissions.',
    metric: '$0.12 to avert 1 metric ton of CO2',
    website: 'rainforestcoalition.org'
  },
  // Education
  {
    id: 'room-to-read',
    category: 'education',
    name: 'Room to Read',
    description: 'Improving literacy and gender equality in education across Asia and Africa.',
    metric: '$300 teaches a child to read for a year',
    website: 'roomtoread.org'
  },
  {
    id: 'khan-academy',
    category: 'education',
    name: 'Khan Academy',
    description: 'Providing free, world-class education for anyone, anywhere.',
    metric: '$20 creates a full course curriculum access',
    website: 'khanacademy.org'
  },
  // Health
  {
    id: 'against-malaria',
    category: 'health',
    name: 'Against Malaria Foundation',
    description: 'Purchasing and distributing long-lasting insecticidal bed nets to protect from malaria.',
    metric: '$5 provides a protective bed net for 2 people',
    website: 'againstmalaria.com'
  },
  {
    id: 'hki',
    category: 'health',
    name: 'Helen Keller International',
    description: 'Preventing blindness and reducing malnutrition through vitamin A distribution.',
    metric: '$1.25 protects a child from vitamin A deficiency',
    website: 'hki.org'
  },
  // Humanitarian
  {
    id: 'givedirectly',
    category: 'humanitarian',
    name: 'GiveDirectly',
    description: 'Sending cash transfers directly to individuals living in extreme poverty.',
    metric: '92% of every dollar goes directly to recipients',
    website: 'givedirectly.org'
  },
  {
    id: 'waterorg',
    category: 'humanitarian',
    name: 'Water.org',
    description: 'Providing access to safe water and sanitation through affordable micro-loans.',
    metric: '$25 provides one person with safe water access',
    website: 'water.org'
  },
  // Arts
  {
    id: 'public-broadcasting',
    category: 'arts',
    name: 'Local PBS/NPR Affiliate',
    description: 'Supporting free educational programming and local independent journalism.',
    metric: '85% of funds support programming and content production',
    website: 'npr.org'
  },
  {
    id: 'museum-access',
    category: 'arts',
    name: 'Museum Education Foundation',
    description: 'Providing free field trips and museum tours for public school students.',
    metric: '$15 sponsors a student museum field trip',
    website: 'museums.org'
  }
];

export const INVESTMENT_PORTFOLIOS = [
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth',
    expectedReturn: 8.5,
    description: 'High-yield equity-focused investments for long-term compounding.',
    allocation: [
      { asset: 'US Equities', percent: 55, color: '#3b82f6' },
      { asset: 'International Equities', percent: 35, color: '#10b981' },
      { asset: 'Fixed Income & Cash', percent: 10, color: '#f59e0b' }
    ]
  },
  {
    id: 'esg-impact',
    name: 'ESG Impact Balanced',
    expectedReturn: 6.8,
    description: 'Portfolio aligned with Environmental, Social, and Governance criteria.',
    allocation: [
      { asset: 'Global Clean Energy', percent: 30, color: '#10b981' },
      { asset: 'Social Impact Bonds', percent: 40, color: '#a78bfa' },
      { asset: 'Sustainable Tech Equities', percent: 30, color: '#60a5fa' }
    ]
  },
  {
    id: 'conservative-income',
    name: 'Conservative Income',
    expectedReturn: 4.2,
    description: 'Focuses on capital preservation with minimal volatility.',
    allocation: [
      { asset: 'Government Bonds', percent: 60, color: '#6b7280' },
      { asset: 'Dividend Equities', percent: 20, color: '#3b82f6' },
      { asset: 'Money Market / Cash', percent: 20, color: '#9ca3af' }
    ]
  },
  {
    id: 'balanced-index',
    name: 'Balanced Index',
    expectedReturn: 6.0,
    description: 'A classic 60/40 blend of diversified index funds.',
    allocation: [
      { asset: 'Broad Stock Market Index', percent: 60, color: '#2563eb' },
      { asset: 'Total Bond Market Index', percent: 40, color: '#4b5563' }
    ]
  }
];

export const STRATEGY_PRESETS = [
  {
    id: 'endowment',
    name: 'Perpetual Endowment',
    description: 'Give a smaller percentage annually, allowing the fund to grow and donate forever.',
    balance: 250000,
    annualContribution: 10000,
    grantPercent: 5,
    portfolioId: 'aggressive-growth',
    years: 25
  },
  {
    id: 'active-giving',
    name: 'Active Impact Plan',
    description: 'Maximize current giving by donating a larger percentage, while maintaining a steady balance.',
    balance: 250000,
    annualContribution: 15000,
    grantPercent: 12,
    portfolioId: 'esg-impact',
    years: 25
  },
  {
    id: 'sunset-fund',
    name: '10-Year Spenddown',
    description: ' sunset the fund in 10 years to maximize front-loaded impact.',
    balance: 250000,
    annualContribution: 0,
    grantPercent: 20,
    portfolioId: 'conservative-income',
    years: 10
  }
];
