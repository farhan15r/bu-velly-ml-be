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
   * Generate csv file from tif
   * generate this.csvPath
   * @returns {Promise<void>}
   * @private
   */
  async generateCsvPixels() {
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

    const pixelValueList = [];

    for (let i = 0; i < this.imgWidth; i++) {
      for (let j = 0; j < this.imgHeight; j++) {        
        const pixelValue = (
          await image.readRasters({ window: [i, j, i + 1, j + 1] })
        )[0][0];
        pixelValueList.push([
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

    this.csvPath = `temp/${this.imgName}.csv`;
    const writeStream = fs.createWriteStream(this.csvPath);
    writeStream.write("x,y,pixelValue,normalizedPixelValue,rgbValue\n");

    for (let i = 0; i < pixelValueList.length; i++) {
      await new Promise((resolve, reject) => {
        writeStream.write(`${pixelValueList[i].join(",")}\n`, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    await new Promise((resolve, reject) => {
      writeStream.end((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Generate png from csv
   * generate this.imgPathPng
   * @returns {Promise<void>}
   * @private
   */
  async generatePngFromCsv() {
    const csvBuffer = readFileSync(this.csvPath);
    const csvString = csvBuffer.toString();
    const csvArray = csvString.split("\n");
    const csvData = csvArray.map((line) => line.split(","));

    const X = [];
    const Y = [];
    const pixelValueNormalized = [];

    for (let i = 1; i < csvData.length; i++) {
      X.push(Number(csvData[i][0]));
      Y.push(Number(csvData[i][1]));
      pixelValueNormalized.push(Number(csvData[i][3]));
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

    const writeSteram = canvas.createPNGStream().pipe(fs.createWriteStream(this.imgPathPng));
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
    fs.unlinkSync(this.csvPath);
  }

  /**
   * Convert tif to png
   * @returns {Promise<void>}
   */
  async convertTifToPng() {
    await this.saveImage();
    await this.generateCsvPixels();
    await this.generatePngFromCsv();
    this.cleanUp();
  }
}

export default Convert;
