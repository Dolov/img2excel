
import ExcelJS from 'exceljs'
import Compressorjs from 'compressorjs'

const unit = 1024

const getKey = (index: number) => {
  index += 1
  let column = '';
  while (index > 0) {
    let remainder = index % 26;
    if (remainder === 0) {
      remainder = 26;
      index--;
    }
    column = String.fromCharCode(remainder + 64) + column;
    index = Math.floor(index / 26);
  }
  return column;
}

const rgbaToArgb = (r: number, g: number, b: number, a: number) => {
  // 确保输入值在0-255之间  
  r = Math.max(0, Math.min(r, 255));
  g = Math.max(0, Math.min(g, 255));
  b = Math.max(0, Math.min(b, 255));
  a = Math.max(0, Math.min(a, 255));

  // 将每个颜色通道转换为16进制字符串  
  let hexR = r.toString(16);
  let hexG = g.toString(16);
  let hexB = b.toString(16);
  let hexA = a.toString(16);

  // 如果转换后的字符串长度小于2，则添加前导零  
  if (hexR.length < 2) hexR = '0' + hexR;
  if (hexG.length < 2) hexG = '0' + hexG;
  if (hexB.length < 2) hexB = '0' + hexB;
  if (hexA.length < 2) hexB = '0' + hexA;

  // 拼接RGB部分的16进制字符串  
  const hex = hexA + hexR + hexG + hexB;

  return hex;
}

const compressor = (file: File, compressorProps?: Compressorjs.Options): Promise<Blob> => {
  return new Promise((resolve) => {
    new Compressorjs(file, {
      resize: "cover",
      ...compressorProps,
      success(result) {
        resolve(result)
      },
      error(err) {
        console.log(err.message);
      },
    });
  })
}

export const recommendQuality = (fileSize: number) => {
  for (let size = 9; size >= 1; size--) {
    if (fileSize / unit / unit > size) {
      return Number((1 - size * 0.1).toFixed(2))
    }
  }
  return 0.6
}

export const recommendSize = (image: HTMLImageElement) => {
  const { width, height } = image

  if (width <= 200) return {
    width,
    height,
  }

  const rates = [{
    threshold: 200,
    rate: 0.2
  },
  {
    threshold: 400,
    rate: 0.4
  },
  {
    threshold: 600,
    rate: 0.6
  },
  {
    threshold: 800,
    rate: 0.8
  },
  {
    threshold: 1000,
    rate: 0.9
  },
  {
    threshold: 2000,
    rate: 0.99
  }
  ]

  let compressedWidth = width;
  for (let i = 0; i < rates.length; i++) {
    const { threshold, rate } = rates[i];
    if (compressedWidth > threshold) {
      // 计算超过当前阈值的部分，并应用对应的税率进行压缩  
      const excess = compressedWidth - threshold;
      const deduction = excess * rate;
      compressedWidth -= deduction;

      // 如果压缩后的宽度小于等于下一个较低的阈值，则跳出循环  
      if (compressedWidth <= (i > 0 ? rates[i - 1].threshold : 0)) {
        break;
      }
    }
  }

  const rate = compressedWidth / width

  return {
    width: Math.ceil(compressedWidth),
    height: Math.ceil(height * rate),
  }
}

export interface Image2ExcelOptions {
  file: File
  worksheets: string[]
  compressorProps?: Compressorjs.Options
  [key: string]: any
}

export class Image2Excel {
  options: Image2ExcelOptions
  originalFile: File

  fileName: string
  workbook: ExcelJS.Workbook
  imageProcessor: ImageProcessor

  constructor(options: Image2ExcelOptions) {
    const { file } = options
    this.options = options
    this.fileName = file.name.split(".")[0]
    this.originalFile = file
  }

  async init() {
    const compressFile = await compressor(this.originalFile, this.options.compressorProps)
    console.log(`压缩文件大小：${(compressFile.size / 1024).toFixed(2)} K`)
    console.log(`原始文件大小：${(this.originalFile.size / 1024).toFixed(2)} K`)

    this.workbook = new ExcelJS.Workbook();

    console.log('this.compressFile: ', compressFile);
    this.imageProcessor = new ImageProcessor(compressFile as unknown as File)

    console.time("drawImage")
    const { ctx, canvas, image } = await this.imageProcessor.drawImage()
    console.timeEnd("drawImage")

    console.time("getImagePixels")
    const pixelMatrix = this.imageProcessor.getImagePixels(ctx, canvas)
    console.timeEnd("getImagePixels")

    this.options.worksheets.forEach((type, index) => {
      // ExcelJS 名称最大保留长度为 31
      const name = `${this.fileName.slice(0, 28)}-${index + 1}`
      const worksheet = this.workbook.addWorksheet(name)
      console.time("setColumns")
      this.setColumns(worksheet, pixelMatrix)
      console.timeEnd("setColumns")

      console.time("setRows")
      this.setRows(worksheet, pixelMatrix, type)
      console.timeEnd("setRows")
    })

    console.time("download")
    this.download()
    console.timeEnd("download")
  }

  setColumns(worksheet: ExcelJS.Worksheet, pixelMatrix: string[][]) {
    worksheet.columns = pixelMatrix[0].map((item, index) => {
      const key = getKey(index)
      return { header: key, key, width: 3 }
    })
  }

  setRows(worksheet: ExcelJS.Worksheet, pixelMatrix: string[][], renderType: string) {
    pixelMatrix.forEach((item, rowIndex) => {
      const row: Record<string, any> = {}
      item.forEach((itemc, cellIndex) => {
        const key = getKey(cellIndex)
        row[key] = itemc
      })

      // 遍历 rowData 来设置每个单元格的样式  
      const columnKeys = Object.keys(row)
      columnKeys.forEach((cellKey, index) => {
        const cellId = cellKey + (rowIndex + 1)
        const cell = worksheet.getCell(cellId)
        // header 无颜色配置，所以从下面一行开始
        const nextRow = pixelMatrix[rowIndex]
        const value = nextRow[index]

        if (renderType === "background") {
          cell.fill = {
            type: 'gradient',
            gradient: 'angle',
            degree: 0,
            stops: [
              { position: 0, color: { argb: value } },
              { position: 0, color: { argb: value } }
            ]
          }
        }

        if (renderType === "border-double") {
          cell.border = {
            top: { style: "double", color: { argb: value } },
            left: { style: 'double', color: { argb: value } },
            bottom: { style: 'double', color: { argb: value } },
            right: { style: 'double', color: { argb: value } }
          }
        }
        cell.value = ""
      });

      // 因为从头部行开始设置了颜色，所以删除掉最后一行，否则会导致多余一行
      if (rowIndex === pixelMatrix.length - 1) return
      worksheet.addRow(row)
    })
  }

  download() {
    this.workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `img2excel-${this.fileName}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }
}

export class ImageProcessor {

  static getProcessor(file: File) {
    if (file.type.includes("image/")) {
      return new Processor(file)
    }
    throw Error("非法的文件类型")
  }

  static async getImage(file: File): Promise<HTMLImageElement> {
    const processor = ImageProcessor.getProcessor(file)
    const base64 = await processor.getBase64()
    const image = new Image();
    return new Promise((resolve => {
      image.onload = () => {
        resolve(image)
      }
      image.src = base64
    }))
  }

  file: File
  constructor(file: File) {
    this.file = file
  }


  async drawImage(): Promise<{ image: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }> {
    const image = await ImageProcessor.getImage(this.file)
    const canvas = document.querySelector('#img2excel-canvas') as HTMLCanvasElement || document.createElement('canvas')
    canvas.id = "img2excel-canvas"

    canvas.style.top = "-10000px"
    canvas.style.left = "-10000px"
    canvas.style.position = "relative"

    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')

    return new Promise(resolve => {
      const { width, height } = image
      canvas.width = width
      canvas.height = height
      ctx!.drawImage(image, 0, 0, width, height);
      resolve({ image, canvas, ctx: ctx! })
    })
  }

  getImagePixels(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // 获取图片的像素数据  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const pixelMatrix = []
    let row = []
    for (let i = 0; i <= data.length; i += 4) {
      let r = data[i];     // 红色分量  
      let g = data[i + 1]; // 绿色分量  
      let b = data[i + 2]; // 蓝色分量  
      let a = data[i + 3]; // 透明度（Alpha）分量

      if (a === 0) {
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }

      const argb = rgbaToArgb(r, g, b, a)
      row.push(argb)
      if (row.length % canvas.width === 0) {
        pixelMatrix.push([...row]);
        row = []
      }
    }
    return pixelMatrix
  }
}


class Processor {
  file: File
  constructor(file: File) {
    this.file = file
  }

  getBase64(blob: Blob = this.file): Promise<string> {
    const reader = new FileReader();
    reader.readAsDataURL(blob); // 读取Blob对象为DataURL  

    return new Promise((resolve) => {
      reader.onloadend = function () {
        const base64data = reader.result as unknown as string; // 获取包含前缀的Base64编码字符串  
        resolve(base64data)
      }
    })
  }
}
