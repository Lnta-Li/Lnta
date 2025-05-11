/**
 * diy-visual-sync.js
 * 功能：检测页面中的diy-container元素，并将diy-main-visual中的图片链接同步到diy-visual-background
 * 同时提取图片主要颜色并应用到颜色面板
 */
document.addEventListener('DOMContentLoaded', function() {
  // 1. 检查页面是否存在diy-container元素
  const diyContainer = document.querySelector('.diy-container');
  
  // 如果不存在diy-container，则不执行后续操作
  if (!diyContainer) return;
  
  // 2. 查找diy-main-visual和diy-visual-background中的图片元素
  const mainVisualImg = diyContainer.querySelector('.diy-main-visual img');
  const backgroundImg = diyContainer.querySelector('.diy-visual-background img');
  
  // 3. 如果两个元素都存在，则将主视觉图片的src同步到背景图片
  if (mainVisualImg && backgroundImg) {
    // 获取主视觉图片的src
    const imgSrc = mainVisualImg.getAttribute('src');
    
    // 设置背景图片的src
    backgroundImg.setAttribute('src', imgSrc);
    
    console.log('DIY视觉背景已同步更新');
    
    // 4. 在图片加载完成后提取主要颜色
    mainVisualImg.onload = function() {
      const colors = extractDominantColors(mainVisualImg, 6);
      applyColorsToPanel(diyContainer, colors);
    };
    
    // 如果图片已经加载完成，直接执行颜色提取
    if (mainVisualImg.complete) {
      const colors = extractDominantColors(mainVisualImg, 6);
      applyColorsToPanel(diyContainer, colors);
    }
  }
});

/**
 * 从图片中提取主要颜色
 * @param {HTMLImageElement} img - 图片元素
 * @param {number} colorCount - 要提取的颜色数量
 * @returns {Array} 颜色数组，格式为 ['#RRGGBB', ...]
 */
function extractDominantColors(img, colorCount) {
  // 创建Canvas元素
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 设置Canvas大小，使用较小的尺寸以提高性能
  const maxSize = 150;
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  
  // 等比例缩小图片尺寸
  if (width > height) {
    if (width > maxSize) {
      height = Math.floor(height * (maxSize / width));
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.floor(width * (maxSize / height));
      height = maxSize;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // 在Canvas上绘制图片
  try {
    ctx.drawImage(img, 0, 0, width, height);
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, width, height).data;
    
    // 收集颜色
    const colorMap = {};
    
    // 遍历像素数据，每四个值表示一个像素(RGBA)
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      
      // 跳过透明像素
      if (a < 128) continue;
      
      // 简化颜色值以减少唯一颜色数量（每个通道精度降低到16个值）
      const quantizedR = Math.round(r / 16) * 16;
      const quantizedG = Math.round(g / 16) * 16;
      const quantizedB = Math.round(b / 16) * 16;
      
      // 转换为十六进制颜色代码
      const hexColor = rgbToHex(quantizedR, quantizedG, quantizedB);
      
      // 更新颜色出现次数
      colorMap[hexColor] = (colorMap[hexColor] || 0) + 1;
    }
    
    // 按出现频率排序颜色
    const sortedColors = Object.keys(colorMap).sort((a, b) => {
      return colorMap[b] - colorMap[a];
    });
    
    // 过滤相似颜色
    const filteredColors = filterSimilarColors(sortedColors, colorCount);
    
    return filteredColors;
  } catch (error) {
    console.error('提取颜色时出错:', error);
    return generateFallbackColors(colorCount);
  }
}

/**
 * 过滤相似颜色，确保颜色多样性
 * @param {Array} colors - 颜色数组
 * @param {number} count - 需要的颜色数量
 * @returns {Array} 过滤后的颜色数组
 */
function filterSimilarColors(colors, count) {
  const result = [];
  const threshold = 30; // 颜色差异阈值
  
  for (let i = 0; i < colors.length && result.length < count; i++) {
    const currentColor = hexToRgb(colors[i]);
    
    // 检查当前颜色与已选颜色的差异
    let isDifferentEnough = true;
    for (let j = 0; j < result.length; j++) {
      const selectedColor = hexToRgb(result[j]);
      const difference = colorDifference(currentColor, selectedColor);
      
      if (difference < threshold) {
        isDifferentEnough = false;
        break;
      }
    }
    
    if (isDifferentEnough) {
      result.push(colors[i]);
    }
  }
  
  // 如果颜色不够，添加后备颜色
  while (result.length < count) {
    result.push(generateRandomColor());
  }
  
  return result;
}

/**
 * 计算两个颜色之间的欧几里得距离
 * @param {Object} color1 - RGB颜色1
 * @param {Object} color2 - RGB颜色2
 * @returns {number} 颜色差异值
 */
function colorDifference(color1, color2) {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}

/**
 * 将RGB颜色转换为十六进制格式
 * @param {number} r - 红色通道值(0-255)
 * @param {number} g - 绿色通道值(0-255)
 * @param {number} b - 蓝色通道值(0-255)
 * @returns {string} 十六进制颜色代码，如 '#FF00FF'
 */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * 将十六进制颜色转换为RGB对象
 * @param {string} hex - 十六进制颜色代码
 * @returns {Object} 包含r、g、b属性的对象
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * 生成随机颜色
 * @returns {string} 十六进制颜色代码
 */
function generateRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
}

/**
 * 生成后备颜色数组
 * @param {number} count - 颜色数量
 * @returns {Array} 颜色数组
 */
function generateFallbackColors(count) {
  // 预定义的色彩丰富的调色板
  const defaultColors = [
    '#FF3E9A', '#4D6FFF', '#4DFFF3', '#6A4DFF', '#3D2A99', '#FFB84D',
    '#FF5252', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#00BCD4'
  ];
  
  if (count <= defaultColors.length) {
    return defaultColors.slice(0, count);
  }
  
  // 如果需要更多颜色，添加随机生成的颜色
  const result = [...defaultColors];
  while (result.length < count) {
    result.push(generateRandomColor());
  }
  
  return result;
}

/**
 * 将提取的颜色应用到颜色面板
 * @param {HTMLElement} container - 包含颜色面板的容器元素
 * @param {Array} colors - 要应用的颜色数组
 */
function applyColorsToPanel(container, colors) {
  const colorDots = container.querySelectorAll('.diy-color-dot');
  if (!colorDots.length) return;
  
  // 应用颜色到每个点
  for (let i = 0; i < Math.min(colorDots.length, colors.length); i++) {
    colorDots[i].style.backgroundColor = colors[i];
  }
  
  console.log('已应用提取的颜色到面板');
} 