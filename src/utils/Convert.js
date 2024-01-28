import { Canvas } from "canvas";
import fs from "fs";
import { fromArrayBuffer } from "geotiff";

const { readFileSync } = fs;

class Convert {
  /**
   * @param {Buffer} imgBuffer
   * @returns {void}
   */
  constructor(imgBuffer) {
    this.imgBuffer = imgBuffer;
    this.pixelValueList = [];
  }

  /**
   * Save image to temp folder for further processing
   * generate this.imgName
   * generate this.imgPathTif
   * @returns {Promise<void>}
   * @private
   */
  async saveImage() {
    this.imgName = Math.floor(new Date().getTime() / 1000);

    this.imgPathTif = `temp/${this.imgName}.tif`;

    await fs.writeFileSync(`${this.imgPathTif}`, this.imgBuffer);
  }

  /**
   * Generate array of pixels
   * @returns {Promise<void>}
   * @private
   */
  async generateArrPixels() {
    const imageBuffer = readFileSync(this.imgPathTif);
    const tiff = await fromArrayBuffer(imageBuffer.buffer);

    const image = await tiff.getImage();
    this.imgWidth = image.getWidth();
    this.imgHeight = image.getHeight();

    let maxPixelValue = Number.NEGATIVE_INFINITY;
    let minPixelValue = Number.POSITIVE_INFINITY;

    for (let i = 0; i < this.imgWidth; i++) {
      for (let j = 0; j < this.imgHeight; j++) {
        const pixelValue = (
          await image.readRasters({ window: [i, j, i + 1, j + 1] })
        )[0][0];
        if (pixelValue >= 0.03) {
          if (pixelValue > maxPixelValue) {
            maxPixelValue = pixelValue;
          }
          if (pixelValue < minPixelValue) {
            minPixelValue = pixelValue;
          }
        }
      }
    }

    this.pixelValueList = [];

    for (let i = 0; i < this.imgWidth; i++) {
      for (let j = 0; j < this.imgHeight; j++) {
        const pixelValue = (
          await image.readRasters({ window: [i, j, i + 1, j + 1] })
        )[0][0];
        this.pixelValueList.push([
          i + 1,
          j + 1,
          pixelValue,
          (pixelValue - minPixelValue) / (maxPixelValue - minPixelValue),
          Math.floor(
            ((pixelValue - minPixelValue) / (maxPixelValue - minPixelValue)) *
              255
          ),
        ]);
      }
    }
  }

  /**
   * Generate png from array of pixels
   * @returns {Promise<void>}
   * @private
   */
  async generatePngFromArr() {
    const X = [];
    const Y = [];
    const pixelValueNormalized = [];

    for (let i = 1; i < this.pixelValueList.length; i++) {
      X.push(Number(this.pixelValueList[i][0]));
      Y.push(Number(this.pixelValueList[i][1]));
      pixelValueNormalized.push(Number(this.pixelValueList[i][3]));
    }

    const canvas = new Canvas(this.imgWidth, this.imgHeight);
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < X.length - 1; i++) {
      const x = X[i];
      const y = Y[i];

      let pixelValue = Math.round(pixelValueNormalized[i] * 255);

      ctx.fillStyle = `rgb(${pixelValue}, ${pixelValue}, ${pixelValue})`;
      ctx.fillRect(x, y, 1, 1);
    }

    this.imgPathPng = `public/upload/${this.imgName}.png`;

    const writeSteram = canvas
      .createPNGStream()
      .pipe(fs.createWriteStream(this.imgPathPng));
    await new Promise((resolve, reject) => {
      writeSteram.on("finish", resolve);
      writeSteram.on("error", reject);
    });
  }

  /**
   * Clean up temp files
   * @returns {void}
   * @private
   */
  cleanUp() {
    fs.unlinkSync(this.imgPathTif);
  }

  /**
   * Convert tif to png
   * @returns {Promise<void>}
   */
  async convertTifToPng() {
    await this.saveImage();
    await this.generateArrPixels();
    await this.generatePngFromArr();
    this.cleanUp();
  }
}

export default Convert;
