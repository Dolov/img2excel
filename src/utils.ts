
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

const compressor = (file: File, quality: number): Promise<Blob> => {
  return new Promise((resolve) => {
    new Compressorjs(file, {
      quality,
      resize: "cover",
      maxWidth: innerWidth * 0.5,
      // maxHeight: innerHeight * 0.5,
      success(result) {
        resolve(result)
      },
      error(err) {
        console.log(err.message);
      },
    });
  })
}

const getquality = (fileSize: number) => {
  for (let size = 9; size >= 1; size--) {
    if (fileSize / unit / unit > size) {
      return 1 - size * 0.1
    }
  }
  return 0.6
}


export interface Image2ExcelOptions {
  file: File
  bordered?: boolean
}

export class Image2Excel {
  options: Image2ExcelOptions
  originalFile: File
  compressFile: Blob

  fileName: string
  workbook: ExcelJS.Workbook
  worksheet: ExcelJS.Worksheet
  imageProcessor: ImageProcessor

  constructor(options: Image2ExcelOptions) {
    const { file } = options
    this.options = options
    this.fileName = file.name.split(".")[0]
    this.originalFile = file

    // 大于 20K 则进行压缩
    if (file.size >= 20 * unit) {
      const quality = getquality(file.size)
      compressor(file, quality).then(res => {
        console.log('quality: ', quality);
        console.log(`压缩文件大小：${(res.size / 1024).toFixed(2)} K`)
        console.log(`原始文件大小：${(file.size / 1024).toFixed(2)} K`)
        this.compressFile = res
        this.init(res as unknown as File)
      })
    } else {
      this.init(file)
    }
  }

  async init(file: File) {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet(this.fileName)
    // this.worksheet.pageSetup.scale = 25
    this.imageProcessor = new ImageProcessor(file)

    console.time("drawImage")
    const { ctx, canvas } = await this.imageProcessor.drawImage()
    console.timeEnd("drawImage")

    console.time("getImagePixels")
    const pixelMatrix = this.imageProcessor.getImagePixels(ctx, canvas)
    console.timeEnd("getImagePixels")

    console.time("setColumns")
    this.setColumns(pixelMatrix)
    console.timeEnd("setColumns")

    console.time("setRows")
    this.setRows(pixelMatrix)
    console.timeEnd("setRows")

    console.time("download")
    this.download()
    console.timeEnd("download")
  }

  setColumns(pixelMatrix: string[][]) {
    this.worksheet.columns = pixelMatrix[0].map((item, index) => {
      const key = getKey(index)
      return { header: key, key, width: 3 }
    })
  }

  setRows(pixelMatrix: string[][]) {
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
        const cell = this.worksheet.getCell(cellId)
        // header 无颜色配置，所以从下面一行开始
        const nextRow = pixelMatrix[rowIndex]
        const value = nextRow[index]

        if (this.options.bordered) {
          cell.border = {
            top: { style: "double", color: { argb: `${cell.value}` } },
            left: { style: 'double', color: { argb: `${cell.value}` } },
            bottom: { style: 'double', color: { argb: `${cell.value}` } },
            right: { style: 'double', color: { argb: `${cell.value}` } }
          }
        } else {
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
        cell.value = ""
      });

      // 因为从头部行开始设置了颜色，所以删除掉最后一行，否则会导致多余一行
      if (rowIndex === pixelMatrix.length - 1) return
      this.worksheet.addRow(row)
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
  pixelMatrix: string[][] = []
  processor: Processor

  constructor(file: File) {
    if (file.type === "image/svg+xml") {
      this.processor = new SvgProcessor(file)
      return
    }
    if (file.type.includes("image/")) {
      this.processor = new Processor(file)
      return
    }
    throw Error("非法的文件类型")
  }

  async drawImage(): Promise<{ image: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }> {
    const base64 = await this.processor.getBase64()
    const canvas = document.querySelector('#img2excel-canvas') as HTMLCanvasElement || document.createElement('canvas')
    canvas.id = "img2excel-canvas"

    canvas.style.top = "-10000px"
    canvas.style.left = "-10000px"
    canvas.style.position = "relative"

    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    const image = new Image();
    return new Promise(resolve => {
      image.onload = () => {
        const { width, height } = image
        canvas.width = width
        canvas.height = height
        ctx!.drawImage(image, 0, 0, width, height);
        resolve({ image, canvas, ctx: ctx! })
      }
      image.src = base64
    })
  }

  getImagePixels(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // 获取图片的像素数据  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
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
        this.pixelMatrix.push([...row]);
        row = []
      }
    }
    return this.pixelMatrix
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


class SvgProcessor extends Processor {

  constructor(file: File) {
    super(file)
  }

  getFileText(): Promise<string> {
    const fileReader = new FileReader()
    return new Promise((resolve => {
      fileReader.onload = function () {
        resolve(fileReader.result as unknown as string)
      }
      fileReader.readAsText(this.file)
    }))
  }

  async getBase64(): Promise<string> {
    const text = await this.getFileText()
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' }); // 创建Blob对象  
    return await super.getBase64(blob)
  }
}