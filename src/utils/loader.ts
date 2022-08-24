export class Loader {
  private images: {
    [imageKey: string]: HTMLImageElement;
  }

  private canvas: {
    [imageKey: string]: HTMLCanvasElement;
  }

  constructor() {
    this.images = {};
    this.canvas = {};
  }

  loadImage(key: string, src: string): Promise<HTMLImageElement | string> {
    const img = new Image();

    const d: Promise<HTMLImageElement | string> = new Promise((resolve, reject) => {
        img.onload = function (this: Loader) {
            this.images[key] = img;
            this.loadImageToCanvas(key);

            resolve(img);
        }.bind(this);

        img.onerror = function () {
            reject('Could not load image: ' + src);
        };
    });

    img.src = src;

    return d;
  }

  getImageCanvas(key: string) {
    return this.canvas[key]
  }

  private getImage (key: string): HTMLImageElement | undefined {
    if (key in this.images) {
      return this.images[key];
    }
  }

  private loadImageToCanvas(key: string) {
    const assetCanvas = document.createElement('canvas');

    const tileAtlasCtx = assetCanvas.getContext('2d');
    const tileAtlasPreloader = this.getImage(key);

    if (tileAtlasCtx && tileAtlasPreloader) {
      assetCanvas.height = tileAtlasPreloader.height;
      assetCanvas.width = tileAtlasPreloader.width;
  
      tileAtlasCtx.drawImage(tileAtlasPreloader, 0, 0);
    }
    
    this.canvas[key] = assetCanvas;
  }
}