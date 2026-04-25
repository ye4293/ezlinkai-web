import type { Locale } from './zh';

const en: Locale = {
  // Navigation
  nav: {
    home: 'Home',
    models: 'Models',
    docs: 'Document',
    marketplace: 'Model Plaza',
    signIn: 'Sign In',
    dashboard: 'Dashboard'
  },
  // User Menu
  userMenu: {
    profile: 'Profile',
    billing: 'Billing',
    settings: 'Settings',
    logout: 'Log out'
  },
  // Hero
  hero: {
    titlePrefix: 'Unified AI Model',
    titleHighlight: 'API Gateway',
    description:
      'Access OpenAI, Claude, Gemini, DeepSeek and more through a single API. Unified authentication and billing, seamless model switching, reduced integration costs.',
    getStarted: 'Get Started',
    viewDocs: 'Documentation'
  },
  // Stats
  stats: {
    models: 'Models',
    modelsValue: '100+',
    developers: 'Developers',
    developersValue: '10,000+',
    uptime: 'Uptime',
    uptimeValue: '99.9%',
    apiCalls: 'Daily API Calls',
    apiCallsValue: '10M+'
  },
  // Features
  features: {
    title: 'Core Capabilities',
    subtitle:
      'The most convenient AI model integration experience for developers',
    multiModel: {
      title: 'Multi-Model Aggregation',
      description:
        'Support for dozens of mainstream AI models including OpenAI, Claude, Gemini, DeepSeek — all through one unified API.'
    },
    billing: {
      title: 'Unified Billing',
      description:
        'Manage usage and costs for all models in one account, with better pricing and transparent billing.'
    },
    performance: {
      title: 'High Availability',
      description:
        'Global multi-node deployment, intelligent load balancing, and automatic failover for reliable service.'
    },
    security: {
      title: 'Security & Compliance',
      description:
        'Enterprise-grade data encryption, comprehensive access control, API key management, and usage auditing.'
    },
    sdk: {
      title: 'Developer Friendly',
      description:
        'OpenAI SDK compatible, with thorough API documentation and code samples for zero-friction integration.'
    },
    monitoring: {
      title: 'Real-time Monitoring',
      description:
        'Visual usage dashboard to track token consumption, request latency, and call success rates in real time.'
    }
  },
  // CTA
  cta: {
    title: 'Get Started Today',
    description:
      'Sign up for free credits and experience the full power of AI models',
    button: 'Sign Up Free'
  },
  // Footer
  footer: {
    rights: 'All rights reserved.'
  },
  // Model Plaza
  modelPlaza: {
    title: 'Model Plaza',
    subtitle: '{count} models available from multiple AI providers',
    search: 'Search models...',
    providers: 'Providers',
    userTier: 'User Tier',
    billingType: 'Billing',
    all: 'All',
    tokenBased: 'Token-based',
    perCall: 'Per Call',
    perCallShort: 'Per Call',
    tokenBasedShort: 'Token',
    input: 'Input',
    output: 'Output',
    perUnit: 'Per Call',
    inputPrice: 'Input $/M',
    outputPrice: 'Output $/M',
    modelName: 'Model',
    provider: 'Provider',
    discount: 'Discount',
    noResults: 'No models found',
    prevPage: 'Previous',
    nextPage: 'Next',
    copyModel: 'Copy model name',
    signIn: 'Sign In',
    backHome: 'Home'
  },
  modelDetail: {
    back: 'Back to Model Plaza',
    performance: 'Performance',
    successRate: 'Success Rate',
    avgLatency: 'Avg Latency',
    avgSpeed: 'Avg Speed',
    inputPrice: 'Input Price',
    outputPrice: 'Output Price',
    priceType: 'Type',
    requests24h: '24h Requests',
    latencyTrend: 'Latency Trend',
    speedTrend: 'Speed (TPS)',
    successRateTrend: 'Success Rate',
    tokenUsage: 'Token Usage',
    pricingDetail: 'Pricing Detail',
    userTier: 'Tier',
    channelDetail: 'Channel Detail',
    channelName: 'Channel',
    adminOnly: 'Admin Only',
    ttftDesc: 'First Token',
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
    noData: 'No Data'
  },
  // Log billing details
  logDetail: {
    channelInfo: 'Channel Info',
    promptTokens: 'Prompt Tokens',
    completionTokens: 'Completion Tokens',
    cachedTokens: 'Cached Tokens',
    cost: 'Cost',
    logContent: 'Log Content',
    noDetails: 'No details available',
    modelPrice: 'Model Price',
    billingProcess: 'Billing Process',
    billingMode: 'Billing Mode',
    tokenBilling: 'Token-based',
    fixedPrice: 'Fixed Price',
    perMillionInput: '/ 1M input tokens',
    perMillionOutput: '/ 1M output tokens',
    perMillionCached: '/ 1M cached tokens',
    perMillionCache5m: '/ 1M 5min cache creation tokens',
    perMillionCache1h: '/ 1M 1h cache creation tokens',
    perMillionCacheRead: '/ 1M cache read tokens',
    perRequest: '/ request',
    referenceOnly: 'For reference only, actual charges may vary',
    groupRatio: 'Group Ratio',
    inputTokens: 'Input Tokens',
    outputTokens: 'Output Tokens',
    inputText: 'Text Input',
    inputImage: 'Image Input',
    outputText: 'Text Output',
    outputImage: 'Image Output',
    outputReasoning: 'Reasoning Output',
    cacheRead: 'Cache Read',
    cacheCreation: 'Cache Creation',
    claudeCache5m: 'Claude 5min Cache Creation',
    claudeCache1h: 'Claude 1h Cache Creation',
    speed: 'Speed',
    collapse: 'Collapse',
    expand: 'Details',
    discountBreakdown: 'Discount Breakdown',
    tierRatio: 'Tier Discount',
    channelDiscount: 'Channel Discount',
    userChannelDiscount: 'User Channel Discount',
    keyIndex: 'Key Index'
  },
  // Pricing settings page
  pricing: {
    title: 'Model Pricing Settings',
    tabRatioSettings: 'Ratio Settings',
    tabVisualPricing: 'Visual Pricing',
    tabUnsetModels: 'Unset Models',
    tabVideoPricing: 'Video Pricing',
    saving: 'Saving...',
    save: 'Save',
    saveSuccess: 'Pricing settings saved successfully.',
    saveFailed: 'Failed to save. Please try again.',
    jsonInvalid: '{field} is not valid JSON — please check the syntax.',
    fixedPrice: 'Fixed Price',
    fixedPriceHint:
      'Per-call charge in USD. Takes precedence over the model ratio.',
    modelRatio: 'Model Ratio',
    cacheRatio: 'Prompt Cache Ratio',
    cacheRatioHint:
      'Price ratio of cached-read tokens vs. input tokens (e.g. Claude cached read = 0.1, a 90% discount).',
    completionRatio: 'Completion Ratio (custom models only)',
    completionRatioHint: 'Applies to custom models only.',
    imageInputRatio: 'Image Input Ratio (supported on selected models)',
    imageOutputRatio: 'Image Output Ratio (supported on selected models)',
    audioInputRatio: 'Audio Input Ratio (supported on selected models)',
    audioOutputRatio: 'Audio Output Ratio (supported on selected models)',
    breadcrumbSettings: 'Settings'
  },
  // Channel form (billing-related)
  channelForm: {
    discountLabel: 'Channel Discount',
    discountPlaceholder: '1.0 = no discount, 0.7 = 30% off'
  },
  // User × channel-type discount editor
  channelRatios: {
    title: 'Channel-Type Discount',
    descriptionPrefix:
      'Multiplied with the channel discount and tier discount. Example: 0.8 will charge',
    formulaCode: 'model price × channel discount × tier discount × 0.8',
    descriptionSuffix: '. Leave blank for 1.0.'
  },
  // v3 Landing page
  landing: {
    nav: {
      models: 'Models',
      pricing: 'Pricing',
      docs: 'Docs',
      changelog: 'Changelog',
      enterprise: 'Enterprise',
      signIn: 'Sign in',
      startBuilding: 'Start building',
      dashboard: 'Dashboard'
    },
    hero: {
      badgeTag: 'New',
      badgeText: 'Claude Opus 4.7 is live',
      titleLine1: 'One API key.',
      titleLine2Em: 'Every frontier model.',
      lede: 'EZLINK speaks the native protocols of OpenAI, Anthropic and Google — drop it into the SDK you already use. No translation layer, no rewrites, no lock-in.',
      createAccount: 'Create free account →',
      readDocs: 'Read the docs',
      subtle: 'Free credits · No credit card required · Cancel anytime'
    },
    marquee: {
      label: '· One API · Every provider ·'
    },
    statement: {
      line1Strong: 'One key.',
      line1Em: 'Every model.',
      line2Em: 'Zero lock-in.',
      sub: 'Built for teams who ship. Automatic failover, production observability, and enterprise SLAs — out of the box.'
    },
    models: {
      eyebrow: 'Top models · this week',
      title: 'The frontier, ',
      titleEm: 'in rank order.',
      viewAll: 'All 180+ models'
    },
    pillars: {
      eyebrow: 'Built for production',
      title: 'Not a reseller. ',
      titleEm: 'Infrastructure.',
      sub: 'Everything you need to run AI in production, without running your own gateway.',
      integration: {
        num: '01 · Integration',
        title: 'Every model, ',
        titleEm: 'one key.',
        desc: 'Switch between 180+ models by changing a single string. No SDK rewrites, no vendor lock-in, no weekend migrations.'
      },
      reliability: {
        num: '02 · Reliability',
        title: 'Automatic ',
        titleEm: 'failover.',
        desc: "If a provider goes down, we route to the next best one — same model family, same endpoint. Your app doesn't blink."
      },
      observability: {
        num: '03 · Observability',
        title: 'Insight, ',
        titleEm: 'by default.',
        desc: 'Every request logged with cost, latency, tokens and model. Per-key analytics, anomaly webhooks, usage dashboards.'
      }
    },
    apps: {
      eyebrow: 'Built with EZLINK',
      title: 'Teams shipping AI, ',
      titleEm: 'at scale.',
      sub: "From weekend projects to series-C companies. Here's a snapshot of apps routing through EZLINK this week.",
      seeAll: 'See all apps',
      primary: 'Primary'
    },
    trust: {
      eyebrow: 'Enterprise',
      title: 'Ready for ',
      titleEm: 'the last mile.',
      sub: 'Everything procurement, security and legal will ask for — before they ask for it.',
      talkToSales: 'Talk to sales',
      compliance: {
        label: 'Compliance',
        value: 'SOC 2 Type II',
        sub: 'GDPR · HIPAA-ready'
      },
      availability: {
        label: 'Availability',
        value: '99.99% SLA',
        sub: 'Written, with penalties'
      },
      support: {
        label: 'Support',
        value: 'Dedicated, 24/7',
        sub: 'Shared Slack · 15-min response'
      },
      deployment: {
        label: 'Deployment',
        value: 'Single-tenant',
        sub: 'VPC · self-hosted options'
      }
    },
    finalCta: {
      titleLine1: 'Ship with ',
      titleEm: 'any model.',
      titleLine2: 'Starting today.',
      sub: 'Free credits on sign-up. No card required. No lock-in.',
      createAccount: 'Create free account →',
      readDocs: 'Read the docs'
    },
    footer: {
      aboutDesc:
        'The unified AI gateway for production. One API, every frontier model, zero lock-in.',
      sections: {
        product: 'Product',
        developers: 'Developers',
        company: 'Company',
        legal: 'Legal'
      },
      links: {
        models: 'Models',
        pricing: 'Pricing',
        dashboard: 'Dashboard',
        changelog: 'Changelog',
        documentation: 'Documentation',
        apiReference: 'API reference',
        sdks: 'SDKs',
        status: 'Status',
        enterprise: 'Enterprise',
        security: 'Security',
        blog: 'Blog',
        careers: 'Careers',
        terms: 'Terms',
        privacy: 'Privacy',
        sla: 'SLA',
        dpa: 'DPA'
      },
      copyright: 'All rights reserved.',
      status: 'All systems operational'
    },
    playground: {
      replay: 'Replay',
      copy: 'Copy',
      copied: 'Copied',
      status: {
        ready: 'Ready',
        streaming: 'Streaming…'
      },
      file: {
        curl: 'request.sh',
        python: 'example.py',
        javascript: 'example.js'
      },
      metrics: {
        provider: 'provider',
        model: 'model',
        tokens: 'tokens',
        latency: 'latency',
        cost: 'cost',
        nativeNote: 'Native protocol · zero translation'
      },
      promptLabel: '>  prompt',
      doneLabel: '✓ Completed'
    }
  },
  // Dashboard
  dashboard: {
    welcome: 'Hi',
    welcomeBack: 'welcome back',
    tabs: {
      overview: 'Overview',
      analytics: 'Analytics'
    },
    cards: {
      balance: {
        title: 'Available Balance',
        used: 'Used',
        usedRatio: 'of total'
      },
      throughput: {
        title: 'Live Throughput',
        tpm: 'Tokens / min',
        rpm: 'Requests / min',
        qpm: 'Spend / min'
      },
      today: {
        title: "Today's Usage",
        requests: 'Requests',
        spend: 'Spend'
      }
    },
    popularModels: {
      title: 'Most Popular Models',
      description: '{count} models called today'
    }
  },
  // User management
  userPage: {
    title: 'Users',
    countSuffix: 'users',
    description: 'Manage system users',
    addNew: 'Add User',
    columns: {
      id: 'ID',
      username: 'Username',
      displayName: 'Display Name',
      email: 'Email',
      group: 'Group',
      statistics: 'Usage',
      role: 'Role',
      status: 'Status',
      actions: 'Actions'
    },
    stats: {
      balance: 'Balance',
      used: 'Used',
      requests: 'Requests'
    },
    role: {
      user: 'User',
      admin: 'Admin',
      root: 'Root',
      unknown: 'Unknown'
    },
    status: {
      activated: 'Active',
      disabled: 'Disabled',
      unknown: 'Unknown'
    },
    actions: {
      label: 'Actions',
      update: 'Edit',
      delete: 'Delete',
      disable: 'Disable',
      enable: 'Enable',
      promote: 'Promote',
      demote: 'Demote'
    }
  },
  // Channel management
  channelPage: {
    title: 'Channels',
    countSuffix: 'channels',
    description: 'Manage AI channels & routing',
    addNew: 'Add Channel',
    columns: {
      id: 'ID',
      name: 'Name',
      group: 'Group',
      type: 'Type',
      priority: 'Priority',
      weight: 'Weight',
      status: 'Status',
      responseTime: 'Response Time',
      usedQuota: 'Used Quota',
      actions: 'Actions'
    },
    status: {
      enabled: 'Enabled',
      manuallyDisabled: 'Disabled',
      autoDisabled: 'Auto-disabled',
      unknown: 'Unknown',
      updating: 'Updating…'
    },
    bulk: {
      delete: 'Delete',
      disable: 'Disable',
      enable: 'Enable'
    },
    response: {
      untested: 'Untested',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      slow: 'Slow',
      lastTest: 'Last test'
    },
    overlay: {
      processing: 'Processing…'
    }
  }
};

export default en;
