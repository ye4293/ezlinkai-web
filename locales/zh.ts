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
  },
  // 日志计费详情
  logDetail: {
    channelInfo: '渠道信息',
    promptTokens: '提示 Token',
    completionTokens: '补全 Token',
    cachedTokens: '缓存 Token',
    cost: '花费',
    logContent: '日志详情',
    noDetails: '暂无详细信息',
    modelPrice: '模型价格',
    billingProcess: '计费过程',
    billingMode: '计费模式',
    tokenBilling: '按 Token 计费',
    fixedPrice: '固定价格',
    perMillionInput: '/ 1M input tokens',
    perMillionOutput: '/ 1M output tokens',
    perMillionCached: '/ 1M cached tokens',
    perRequest: '/ 次',
    referenceOnly: '仅供参考，以实际扣费为准',
    groupRatio: '分组倍率',
    inputTokens: '输入 Tokens',
    outputTokens: '输出 Tokens',
    inputText: '文本输入',
    inputImage: '图片输入',
    outputText: '文本输出',
    outputImage: '图片输出',
    outputReasoning: '推理输出',
    cacheRead: '缓存读取',
    cacheCreation: '缓存创建',
    claudeCache5m: 'Claude 5分钟缓存创建',
    speed: '生成速率',
    collapse: '收起详情',
    expand: '展开详情',
    discountBreakdown: '折扣分量',
    tierRatio: '等级折扣',
    channelDiscount: '渠道折扣',
    userChannelDiscount: '用户渠道折扣',
    keyIndex: 'Key 索引'
  },
  // v3 Landing page
  landing: {
    nav: {
      models: '模型',
      pricing: '价格',
      docs: '文档',
      changelog: '更新日志',
      enterprise: '企业版',
      signIn: '登录',
      startBuilding: '开始构建',
      dashboard: '控制台'
    },
    hero: {
      badgeTag: '新',
      badgeText: 'Claude Opus 4.7 已上线',
      titleLine1: '一把密钥。',
      titleLine2Em: '直通每个前沿模型。',
      lede: '直接讲 OpenAI、Anthropic、Google 的原生协议——插入你正在用的 SDK 即可。没有翻译层、没有改写、没有锁定。',
      createAccount: '免费注册 →',
      readDocs: '阅读文档',
      subtle: '免费额度 · 无需信用卡 · 可随时取消'
    },
    marquee: {
      label: '· 一个 API · 覆盖全部供应商 ·'
    },
    statement: {
      line1Strong: '一把密钥。',
      line1Em: '每个模型。',
      line2Em: '零锁定。',
      sub: '为发货团队打造。自动故障切换、生产级可观测性、企业 SLA——开箱即用。'
    },
    models: {
      eyebrow: '本周热门模型',
      title: '前沿模型，',
      titleEm: '按排名列出。',
      viewAll: '查看全部 180+ 模型'
    },
    pillars: {
      eyebrow: '为生产而生',
      title: '不是中间商。',
      titleEm: '而是基础设施。',
      sub: '在生产环境跑 AI 的一切，你无需自建网关。',
      integration: {
        num: '01 · 集成',
        title: '每个模型，',
        titleEm: '一把密钥。',
        desc: '改一个字符串即可在 180+ 模型之间切换。无需改 SDK、不被厂商锁定、周末不必加班迁移。'
      },
      reliability: {
        num: '02 · 可靠性',
        title: '自动',
        titleEm: '故障切换。',
        desc: '供应商宕机，我们自动路由到同一家族的下一个最佳端点。你的应用不会眨一下眼。'
      },
      observability: {
        num: '03 · 可观测性',
        title: '洞察，',
        titleEm: '默认开启。',
        desc: '每次请求记录成本、延迟、token 与模型。按 Key 的分析、异常 Webhook、用量仪表盘一应俱全。'
      }
    },
    apps: {
      eyebrow: '基于 EZLINK 构建',
      title: '正在规模化交付 AI 的',
      titleEm: '团队。',
      sub: '从周末项目到 C 轮公司——本周这些应用正在通过 EZLINK 路由。',
      seeAll: '查看所有应用',
      primary: '主要模型'
    },
    trust: {
      eyebrow: '企业版',
      title: '为',
      titleEm: '最后一公里准备好。',
      sub: '采购、安全、法务会问到的一切——在他们开口之前已备齐。',
      talkToSales: '联系销售',
      compliance: {
        label: '合规',
        value: 'SOC 2 Type II',
        sub: 'GDPR · 支持 HIPAA'
      },
      availability: {
        label: '可用性',
        value: '99.99% SLA',
        sub: '书面承诺，违约赔付'
      },
      support: {
        label: '技术支持',
        value: '专属 7×24',
        sub: '共享 Slack · 15 分钟响应'
      },
      deployment: {
        label: '部署',
        value: '单租户',
        sub: 'VPC · 可自托管'
      }
    },
    finalCta: {
      titleLine1: '任意模型，',
      titleEm: '',
      titleLine2: '从今天开始发货。',
      sub: '注册即赠免费额度。无需信用卡。不会锁定。',
      createAccount: '免费注册 →',
      readDocs: '阅读文档'
    },
    footer: {
      aboutDesc:
        '面向生产的统一 AI 网关。一个 API、覆盖前沿模型、零供应商锁定。',
      sections: {
        product: '产品',
        developers: '开发者',
        company: '公司',
        legal: '法务'
      },
      links: {
        models: '模型',
        pricing: '价格',
        dashboard: '控制台',
        changelog: '更新日志',
        documentation: '文档',
        apiReference: 'API 参考',
        sdks: 'SDK',
        status: '服务状态',
        enterprise: '企业版',
        security: '安全',
        blog: '博客',
        careers: '招聘',
        terms: '条款',
        privacy: '隐私',
        sla: 'SLA',
        dpa: 'DPA'
      },
      copyright: '保留所有权利。',
      status: '所有系统正常运行'
    },
    playground: {
      replay: '重新播放',
      copy: '复制',
      copied: '已复制',
      status: {
        ready: '就绪',
        streaming: '流式输出中…'
      },
      file: {
        curl: 'request.sh',
        python: 'example.py',
        javascript: 'example.js'
      },
      metrics: {
        provider: '供应商',
        model: '模型',
        tokens: 'tokens',
        latency: '延迟',
        cost: '成本',
        nativeNote: '原生协议 · 零翻译'
      },
      promptLabel: '>  prompt',
      doneLabel: '✓ 完成'
    }
  }
};

// Deep type that widens all string literals to string
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export default zh;
export type Locale = DeepString<typeof zh>;
