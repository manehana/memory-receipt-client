export function getScreenScale(width: number, height: number) {
  const widthScale = Math.min(width / 414, 1);
  const heightScale = Math.min(height / 896, 1);

  return Math.max(Math.min(widthScale, heightScale), 0.82);
}

export function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}
