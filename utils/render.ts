// import { SystemStatus } from "@/types"
// import { message } from "@/utils/message";

/**
 * 将数字转换为可读格式，例如将大数字转换为“B”、“M”、“k”表示的形式。
 *
 * @param {number} num - 要转换的数字。
 * @returns {string|number} - 转换后的字符串或原始数字。
 */
export function renderNumber(num) {
  if (num >= 1000000000) {
    // 检查数字是否大于等于10亿
    // 将数字转换为十亿形式，并保留一位小数，然后添加后缀“B”
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    // 检查数字是否大于等于100万
    // 将数字转换为百万形式，并保留一位小数，然后添加后缀“M”
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    // 检查数字是否大于等于1万
    // 将数字转换为千形式，并保留一位小数，然后添加后缀“k”
    return (num / 1000).toFixed(1) + 'k';
  } else {
    // 如果数字小于1万，则返回原始数字
    return num;
  }
}

/**
 * 根据给定的配额值和指定的小数位数渲染配额。
 *
 * @param {number} quota - 要渲染的配额值。
 * @param {number} [digits=2] - 小数位数，默认为2。
 * @returns {string|number} - 渲染后的配额，可能是字符串（货币形式）或数字（常规形式）。
 */
export function renderQuota(quota, digits = 2) {
  // 从本地存储中获取配额单位
  let quotaPerUnit: string | number = localStorage.getItem('quota_per_unit');
  // 从本地存储中获取显示货币标识
  let displayInCurrency: string | boolean = localStorage.getItem(
    'display_in_currency'
  );
  // 将配额单位转换为数字
  quotaPerUnit = parseFloat(quotaPerUnit);
  // 将显示货币标识转换为布尔值
  displayInCurrency = displayInCurrency === 'true';
  // 如果需要显示货币形式
  if (displayInCurrency) {
    // 将配额转换为货币形式，并保留指定小数位数，然后添加货币符号"$"
    return '$' + (quota / quotaPerUnit).toFixed(digits);
  }
  // 如果不需要显示货币形式，则调用 renderNumber 函数以常规形式渲染配额
  return renderNumber(quota);
}

/**
 * 计算渲染配额数。
 *
 * @param {number} quota - 要渲染的配额值。
 * @param {number} digits - 小数点后要显示的位数。默认为 2。
 * @returns {number} - 渲染的配额数作为浮点数。
 */
export function renderQuotaNum(quota, digits = 2) {
  // 从本地存储中获取每单位配额
  let quotaPerUnit: string | number = localStorage.getItem('quota_per_unit');
  // 将每单位配额转换为浮点数
  quotaPerUnit = parseFloat(quotaPerUnit);
  // 计算结果并将其转换为具有指定位数的字符串
  const result = (quota / quotaPerUnit).toFixed(digits);
  // 将结果字符串转换回浮点数并返回
  return parseFloat(result);
}

export function renderQuotaWithPrompt(quota, digits = 2) {
  let displayInCurrency: string | boolean = localStorage.getItem(
    'display_in_currency'
  );
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return `（Equivalent amount：${renderQuota(quota, digits)}）`;
  }
  return '';
}

// 复制令牌
export const onCopyToken = async (key) => {
  navigator.clipboard
    .writeText(key)
    .then(() => {
      // message("复制成功", { type: "success" });
    })
    .catch(() => {
      // message("复制失败", { type: "error" });
    });
};

// 复制
export const onCopy = async (type, key) => {
  let status: any = localStorage.getItem('status');
  let serverAddress = '';
  if (status) {
    status = JSON.parse(status);
    serverAddress = status.server_address;
  }
  if (serverAddress === '') {
    serverAddress = window.location.origin;
  }
  let encodedServerAddress = encodeURIComponent(serverAddress);
  const nextLink = localStorage.getItem('chat_link');
  let nextUrl;

  if (nextLink) {
    nextUrl =
      nextLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
  } else {
    nextUrl = `https://chat.oneapi.pro/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
  }

  let url;
  switch (type) {
    case 'ama':
      url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
      break;
    case 'opencat':
      url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
      break;
    case 'next':
      url = nextUrl;
      break;
    default:
      url = `sk-${key}`;
  }
  navigator.clipboard
    .writeText(url)
    .then(() => {
      // message("复制成功", { type: "success" });
    })
    .catch(() => {
      // message("复制失败", { type: "error" });
    });
};

// 聊天
export const onOpenLink = async (type, key) => {
  let status: any = localStorage.getItem('status');
  let serverAddress = '';
  if (status) {
    status = JSON.parse(status);
    serverAddress = status.server_address;
  }
  if (serverAddress === '') {
    serverAddress = window.location.origin;
  }
  let encodedServerAddress = encodeURIComponent(serverAddress);
  const chatLink = localStorage.getItem('chat_link');
  let defaultUrl;

  if (chatLink) {
    defaultUrl =
      chatLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
  } else {
    defaultUrl = `https://chat.oneapi.pro/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
  }
  let url;
  switch (type) {
    case 'ama':
      url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
      break;

    case 'opencat':
      url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
      break;

    default:
      url = defaultUrl;
  }

  window.open(url, '_blank');
};

export const verifyJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
