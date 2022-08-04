export class GameObject {
  ctx: CanvasRenderingContext2D;
  gameObject: HTMLCanvasElement;
  xSource: number;
  ySource: number;
  widthSource: number;
  width: number;
  heightSource: number;
  height: number;
  x: number;
  y: number;
  scaleFactor = 1;
  opacity = 1;

  animationCounter = 0;
  animation = false;
  animationXOffset = 0;
  animationYOffset = 0;
  animationOnTrigger = false;
  animationDelay = 0;
  animationNOfFrames = 0;
  animationFrame = 0;

  constructor(ctx: CanvasRenderingContext2D, gameObject: HTMLCanvasElement, xSource: number, ySource: number, width: number, height: number, x: number, y: number) {
    this.ctx = ctx;
    this.gameObject = gameObject;
    this.xSource = xSource;
    this.ySource = ySource
    this.widthSource = width;
    this.width = width;
    this.heightSource = height;
    this.height = height;
    this.x = x;
    this.y = y;
  }

  update(gameObject: HTMLCanvasElement) {
    this.gameObject = gameObject;
  }

  updateSourcePosition(xSource: number, ySource: number) {
    this.xSource = xSource;
    this.ySource = ySource;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y
    }
  }

  setWidth(width: number) {
    this.widthSource = width;
    this.width = width;
  }

  setScale(scaleFactor: number) {
    this.scaleFactor = scaleFactor;

    const newWidth = this.scaleFactor * this.widthSource;
    const newHeight = this.scaleFactor * this.heightSource;

    this.x += (this.width - newWidth) / 2;
    this.y += this.height - newHeight;

    this.width = newWidth;
    this.height = newHeight;
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
  }

  setAnimation(onTrigger: boolean, delay: number, xSourceOffset: number, ySourceOffset: number, animationNOfFrames: number) {
    this.animationOnTrigger = onTrigger;
    this.animationXOffset = xSourceOffset;
    this.animationYOffset = ySourceOffset;
    this.animationDelay = delay;
    this.animationNOfFrames = animationNOfFrames;

    this.animation = true;
  }

  animationTrigger(frame: number) {
    this.animationFrame = frame;
  }

  scaleTo(delta: number, speed: number, toFactor: number) {
    const newScaleFactor = this.scaleFactor + delta * speed;
    this.scaleFactor = newScaleFactor > toFactor ? toFactor : newScaleFactor;

    const newWidth = this.scaleFactor * this.widthSource;
    const newHeight = this.scaleFactor * this.heightSource;

    this.x += (this.width - newWidth) / 2;
    this.y += this.height - newHeight;

    this.width = newWidth;
    this.height = newHeight;

    this.render(delta);

    if (this.scaleFactor < toFactor) {
      return false;
    } else {
      return true;
    }
  }

  opacityTo(delta: number, speed: number, toVisible: boolean, toOpacity: number) {
    let newOpacity;

    if (toVisible) {
      newOpacity = this.opacity + delta * speed;
      this.opacity = newOpacity > toOpacity ? toOpacity : newOpacity;
    } else {
      newOpacity = this.opacity - delta * speed;
      this.opacity = newOpacity < toOpacity ? toOpacity : newOpacity;
    }

    this.render(delta);

    if ((toVisible && this.opacity < toOpacity) || (!toVisible && this.opacity > toOpacity)) {
      return false;
    } else {
      return true;
    }
  }

  animate(delta: number, speed: number, dirx: number, diry: number, endx: number, endy: number, drawWhenFinished: boolean) {
    const newx = this.x + delta * speed * dirx;
    const newy = this.y + delta * speed * diry;

    if ((dirx === -1 && newx > endx) || (dirx === 1 && newx < endx) || 
        (diry === -1 && newy > endy) || (diry === 1 && newy < endy)) {
      this.x = newx;
      this.y = newy;

      this.render();

      return false;
    } else {
      if (drawWhenFinished) {
        this.render();
      }

      return true;
    }
  }

  render(delta = 0) {
    let xSource = this.xSource;
    let ySource = this.ySource;

    if (this.animation) {
      let frame;
      if (this.animationOnTrigger) {
        frame = this.animationFrame;

        if (frame >= this.animationNOfFrames) {
          frame = 0;
  
          this.animationFrame = 0;
        }
      } else {
        frame = this.animationCounter / this.animationDelay << 0;

        if (frame >= this.animationNOfFrames) {
          frame = 0;
  
          this.animationCounter = 0;
        }  
      }

      xSource = this.xSource + frame * this.animationXOffset;
      ySource = this.ySource + frame * this.animationYOffset;
    }

    this.ctx.globalAlpha = this.opacity;
    this.ctx.drawImage(
      this.gameObject,
      xSource,
      ySource,
      this.widthSource,
      this.heightSource,
      this.x << 0,
      this.y << 0,
      this.width,
      this.height,
    );
    this.ctx.globalAlpha = 1;

    this.animationCounter += delta * 1000;
  }
}
