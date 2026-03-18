const zh = {
  // 导航
  nav: {
    models: '模型列表',
    docs: '文档',
    marketplace: '应用市场',
    signIn: '登录'
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
  }
};

// Deep type that widens all string literals to string
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export default zh;
export type Locale = DeepString<typeof zh>;
