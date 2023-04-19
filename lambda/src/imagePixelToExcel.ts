import fs from 'fs'
import Jimp from 'jimp'
// @ts-ignore
import XlsxPopulate from 'xlsx-populate'
import { excelIndexToColumn, rgbToHex } from './utils'


class ImagePixelToExcel {
  inputImage: any
  constructor(inputImage: Buffer) {
    this.inputImage = inputImage
  }
  
  async init() {
    console.log('初始化')
    const matrix = await this.getImagePixelMatrix()
    if (!matrix) return
    console.log('开始填充像素点')
    console.time('生成 excel')
    const file = await this.fillExcelColor(matrix)
    console.timeEnd('生成 excel')
    return file
  }

  /** 获取图片像素颜色矩阵 */
  async getImagePixelMatrix() {
    const image = await Jimp.read(this.inputImage)
      .catch(err => {
        console.log('Jimp err: ', err);
      })

    if (!image) return null
    const oWidth = image.bitmap.width
    const resize = oWidth > 500 ? 500 : oWidth
    // @ts-ignore
    await image.resize(resize, Jimp.AUTO);
    
    const { width, height } = image.bitmap
    const matrix: string[][] = []
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        const {
          r,
          g,
          b
        } = Jimp.intToRGBA(image.getPixelColor(x, y));
        const color = rgbToHex(r,g,b)
        row.push(color)
      }
      matrix.push(row)
    }
    return matrix
  }

  /** 填充单元格背景色 */
  async fillExcelColor(matrix: string[][]) {
    const workbook = await XlsxPopulate.fromBlankAsync()
    const sheet = workbook.sheet("Sheet1");
    matrix.forEach((row: string[], index: number) => {
      row.forEach((color: string, cindex: number) => {
        const column = excelIndexToColumn(cindex + 1)
        const cell = `${column}${index + 1}`
        sheet.column(column).width(3);
        sheet.cell(cell).style('fill', {
          color
        });
      })
    })
    return await workbook.outputAsync()
  }

  async generateExcel(path: string, excelData: Buffer) {
    fs.writeFileSync(path, excelData)
  }
}

export default ImagePixelToExcel
