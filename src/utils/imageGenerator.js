/**
 * Génère une image avec du texte superposé (pour image 1 et 3)
 * Si l'image source n'a pas les bonnes dimensions : pleine largeur, centrée en hauteur, bandes noires en haut/bas
 */
export function generateImageWithText(imageUrl, text, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const width = options.width || 1080;
      const height = options.height || 1920;
      canvas.width = width;
      canvas.height = height;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      const scale = Math.max(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const imgX = (width - scaledWidth) / 2;
      const imgY = (height - scaledHeight) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, imgX, imgY, scaledWidth, scaledHeight);
      
      // Style du texte
      const fontSize = options.fontSize || Math.round(width * 0.045);
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = options.textColor || 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = options.strokeColor || 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = options.strokeWidth || 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textXValues = [400, 300];
      const textYValues = [250, 500, 700];
      const textX = options.textX ?? textXValues[Math.floor(Math.random() * textXValues.length)];
      const textY = options.textY ?? textYValues[Math.floor(Math.random() * textYValues.length)];
      const maxWidth = options.maxWidth ?? 450;
      
      // Ombre portée pour lisibilité
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      wrapText(ctx, text, textX, textY, maxWidth, fontSize * 1.3);
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Erreur chargement image: ' + imageUrl));
    img.src = imageUrl;
  });
}

/**
 * Génère l'image 2 : lockscreen avec pensée positive (widget visible)
 * Pour l'instant on superpose la pensée en bas (style widget)
 */
export function generateLockscreenWithThought(imageUrl, thought, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Widget : style iPhone lockscreen - gauche, sous l'heure, typo système
      // Position : à ajuster selon tes préférences (proportions de l'image)
      const textLeft = 50;
      const widgetY = 460;
      const textMaxWidth = width * 0.45;
      ctx.font = `400 26px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      wrapTextLeft(ctx, thought, textLeft, widgetY, textMaxWidth, 30);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Erreur chargement image: ' + imageUrl));
    img.src = imageUrl;
  });
}

/**
 * Génère l'image 3 : zoom sur la pensée + phrase
 * On fait un "zoom" en prenant la zone du widget (bas de l'image) et on ajoute la phrase
 */
export function generateZoomWithPhrase(lockscreenWithThoughtUrl, phrase, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;
      
      // Zoom propre : crop avec le même ratio que l'image (pas d'étirement)
      // Zone : centre-haut (heure + widget)
      const cropHeight = height * 0.70;
      const cropWidth = cropHeight * (width / height);
      const cropX = 0;
      const cropY = 130;
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
      
      // Overlay sombre léger
      // ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      // ctx.fillRect(0, 0, width, height);
      
      // Phrase en grand (proportions variables)
      const fontSize = Math.round(width * 0.041);
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = Math.round(width * 0.003);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      wrapText(ctx, phrase, 400, 650, 400, fontSize * 1.5);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Erreur chargement image'));
    img.src = lockscreenWithThoughtUrl;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  let drawY = y - totalHeight / 2 + lineHeight / 2;

  lines.forEach(line => {
    ctx.strokeText(line, x, drawY);
    ctx.fillText(line, x, drawY);
    drawY += lineHeight;
  });
}

function wrapTextLeft(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  let drawY = y - totalHeight / 2 + lineHeight / 2;

  lines.forEach(line => {
    ctx.fillText(line, x, drawY);
    drawY += lineHeight;
  });
}
