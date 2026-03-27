const zh = {
  // 导航
  nav: {
    home: '首页',
    models: '模型列表',
    docs: '文档',
    marketplace: '模型广场',
    signIn: '登录',
    dashboard: '控制台'
  },
  // 用户菜单
  userMenu: {
    profile: '个人资料',
    billing: '账单管理',
    settings: '设置',
    logout: '退出登录'
  },
  // Hero
  hero: {
    titlePrefix: '统一AI模型',
    titleHighlight: 'API网关平台',
    description:
      '支持 OpenAI、Claude、Gemini、DeepSeek 等主流大模型，一个接口接入所有AI能力。统一认证与计费，轻松切换模型，降低接入成本。',
    getStarted: '开始使用',
    viewDocs: '查看文档'
  },
  // 数据统计
  stats: {
    models: '支持模型',
    modelsValue: '100+',
    developers: '开发者',
    developersValue: '10,000+',
    uptime: '服务可用率',
    uptimeValue: '99.9%',
    apiCalls: '日均调用',
    apiCallsValue: '1,000万+'
  },
  // 特性
  features: {
    title: '核心能力',
    subtitle: '为开发者提供最便捷的AI模型接入体验',
    multiModel: {
      title: '多模型聚合',
      description:
        '支持 OpenAI、Claude、Gemini、DeepSeek 等数十种主流AI模型，一个API统一调用。'
    },
    billing: {
      title: '统一计费管理',
      description:
        '一个账户统一管理所有模型的用量和费用，价格更优惠，计费更透明。'
    },
    performance: {
      title: '高可用低延迟',
      description:
        '全球多节点部署，智能负载均衡，自动故障转移，确保服务高可用。'
    },
    security: {
      title: '安全合规',
      description:
        '企业级数据加密，完善的权限控制体系，支持 API Key 管理与访问审计。'
    },
    sdk: {
      title: '开发者友好',
      description:
        '兼容 OpenAI SDK，提供完善的接口文档与代码示例，零学习成本快速接入。'
    },
    monitoring: {
      title: '实时监控',
      description:
        '可视化用量仪表盘，实时追踪 Token 消耗、请求延迟与调用成功率。'
    }
  },
  // CTA
  cta: {
    title: '立即开始使用',
    description: '注册即可获得免费额度，快速体验所有AI模型的强大能力',
    button: '免费注册'
  },
  // Footer
  footer: {
    rights: 'All rights reserved.'
  },
  // 模型广场
  modelPlaza: {
    title: '模型广场',
    subtitle: '共 {count} 个可用模型，支持多种 AI 供应商',
    search: '搜索模型名称...',
    providers: '供应商',
    userTier: '用户等级',
    billingType: '计费类型',
    all: '全部',
    tokenBased: '按量计费',
    perCall: '按次计费',
    perCallShort: '按次',
    tokenBasedShort: '按量',
    input: '输入',
    output: '输出',
    perUnit: '单次',
    inputPrice: '输入价格/M',
    outputPrice: '输出价格/M',
    modelName: '模型名称',
    provider: '供应商',
    discount: '折扣',
    noResults: '没有找到匹配的模型',
    prevPage: '上一页',
    nextPage: '下一页',
    copyModel: '复制模型名称',
    signIn: '登录',
    backHome: '首页'
  },
  // 模型详情
  modelDetail: {
    back: '返回模型广场',
    performance: '性能监控',
    successRate: '成功率',
    avgLatency: '平均延迟',
    avgSpeed: '平均速度',
    inputPrice: '输入价格',
    outputPrice: '输出价格',
    priceType: '计费类型',
    requests24h: '24h 请求量',
    latencyTrend: '延迟趋势',
    speedTrend: '速度 (TPS)',
    successRateTrend: '成功率趋势',
    tokenUsage: '用量分析',
    pricingDetail: '定价详情',
    userTier: '用户等级',
    channelDetail: '渠道明细',
    channelName: '渠道名称',
    adminOnly: '仅管理员可见',
    ttftDesc: '首 Token 延迟',
    healthy: '正常',
    degraded: '降级',
    down: '异常',
    noData: '无数据'
  }
};

// Deep type that widens all string literals to string
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export default zh;
export type Locale = DeepString<typeof zh>;
