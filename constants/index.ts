/** 渠道类型 */
export const CHANNEL_OPTIONS = [
  { key: 1, text: 'OpenAI', value: 1, color: 'green' },
  { key: 14, text: 'Anthropic Claude', value: 14, color: 'black' },
  { key: 3, text: 'Azure OpenAI', value: 3, color: 'olive' },
  { key: 11, text: 'Google PaLM2', value: 11, color: 'orange' },
  { key: 24, text: 'Google Gemini', value: 24, color: 'orange' },
  { key: 28, text: 'Mistral AI', value: 28, color: 'orange' },
  { key: 31, text: '零一万物', value: 31, color: 'green' },
  { key: 32, text: 'midjourney-Plus', value: 32, color: 'green' },
  { key: 33, text: 'AWS Claude', value: 33, color: 'black' },
  { key: 34, text: 'Coze', value: 34, color: 'blue' },
  { key: 35, text: 'Cohere', value: 35, color: 'green' },
  { key: 36, text: 'together', value: 36, color: 'blue' },
  { key: 37, text: 'Deepseek', value: 37, color: 'green' },
  { key: 38, text: 'Stability', value: 38, color: 'blue' },
  { key: 39, text: 'Novita', value: 39, color: 'blue' },
  { key: 40, text: 'Replicate', value: 40, color: 'blue' },
  { key: 30, text: 'Ollama', value: 30, color: 'orange' },
  { key: 29, text: 'Groq', value: 29, color: 'orange' },
  { key: 15, text: '百度文心千帆', value: 15, color: 'blue' },
  { key: 17, text: '阿里通义千问', value: 17, color: 'orange' },
  { key: 18, text: '讯飞星火认知', value: 18, color: 'blue' },
  { key: 16, text: '智谱 ChatGLM', value: 16, color: 'violet' },
  { key: 19, text: '360 智脑', value: 19, color: 'blue' },
  { key: 25, text: 'Moonshot AI', value: 25, color: 'black' },
  { key: 23, text: '腾讯混元', value: 23, color: 'teal' },
  { key: 26, text: '百川大模型', value: 26, color: 'orange' },
  { key: 27, text: 'MiniMax', value: 27, color: 'red' },
  { key: 8, text: '自定义渠道', value: 8, color: 'pink' },
  { key: 22, text: '知识库：FastGPT', value: 22, color: 'blue' },
  { key: 21, text: '知识库：AI Proxy', value: 21, color: 'purple' },
  { key: 20, text: '代理：OpenRouter', value: 20, color: 'black' },
  { key: 2, text: '代理：API2D', value: 2, color: 'blue' },
  { key: 5, text: '代理：OpenAI-SB', value: 5, color: 'brown' },
  { key: 7, text: '代理：OhMyGPT', value: 7, color: 'purple' },
  { key: 10, text: '代理：AI Proxy', value: 10, color: 'purple' },
  { key: 4, text: '代理：CloseAI', value: 4, color: 'teal' },
  { key: 6, text: '代理：OpenAI Max', value: 6, color: 'violet' },
  { key: 9, text: '代理：AI.LS', value: 9, color: 'yellow' },
  { key: 12, text: '代理：API2GPT', value: 12, color: 'blue' },
  { key: 13, text: '代理：AIGC2D', value: 13, color: 'purple' }
];

/** 模型重定向example */
export const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo-0301': 'gpt-3.5-turbo',
  'gpt-4-0314': 'gpt-4',
  'gpt-4-32k-0314': 'gpt-4-32k'
};

/** 令牌复制 */
export const COPY_OPTIONS = [
  { key: 'next', text: 'ChatGPT Next Web', value: 'next' },
  { key: 'ama', text: 'AMA 问天', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' }
];

/** 令牌聊天 */
export const OPEN_LINK_OPTIONS = [
  { key: 'ama', text: 'AMA 问天', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' }
];

/** 日志类型 */
export const LOG_OPTIONS = [
  { key: '0', label: 'All', value: '0' },
  { key: '1', label: 'Billing', value: '1' },
  { key: '2', label: 'Consumption', value: '2' },
  { key: '3', label: 'Management', value: '3' },
  { key: '4', label: 'System', value: '4' },
  { key: '5', label: 'Error', value: '5' }
];
