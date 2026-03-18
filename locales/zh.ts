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
