export function getScreenScale(width: number, height: number) {
  const widthScale = Math.min(width / 428, 1);
  const heightScale = Math.min(height / 926, 1);

  return Math.max(Math.min(widthScale, heightScale), 0.64);
}

export function getFontScale(width: number, height: number) {
  const widthScale = Math.min(width / 428, 1);
  const heightScale = Math.min(height / 926, 1);

  return Math.max(Math.min(widthScale, heightScale), 0.76);
}

export function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function fontScaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function getButtonWidth(width: number, horizontalPadding = 23) {
  return Math.min(width - horizontalPadding * 2, 370);
}
