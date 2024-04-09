
import ExcelJS from 'exceljs'


export const getKey = (index: number) => {
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

function rgbaToArgb(r: number, g: number, b: number, a: number) {
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
  let hex = hexA + hexR + hexG + hexB;

  // 如果需要，可以返回包括Alpha通道的rgba字符串（但Alpha不是16进制）  
  // return `rgba(${r},${g},${b},${a})`;  

  // 只返回RGB部分的16进制字符串  
  return hex;
}


export interface Image2ExcelOptions {
  file: File
  worksheetName?: string
}

export class Image2Excel {
  workbook: ExcelJS.Workbook
  worksheet: ExcelJS.Worksheet
  imageProcessor: ImageProcessor

  constructor(options: Image2ExcelOptions) {
    const { worksheetName = "未命名", file } = options
    this.imageProcessor = new ImageProcessor(file)
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet(worksheetName)
    this.init()
  }

  async init() {
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
        
        const cellId = cellKey + (rowIndex+1)
        const cell = this.worksheet.getCell(cellId)
        // header 行
        if (rowIndex === 0) {
          console.log('cell.value: ', cell.value);
          cell.fill = {
            type: "pattern",
            pattern: "darkGrid",
            bgColor: {
              argb: `${cell.value}`
            }
          }
          cell.value = ""
          return
        }

        cell.fill = {
          type: 'gradient',
          gradient: 'angle',
          degree: 0,
          stops: [
            { position: 0, color: { argb: `${cell.value}` } },
            { position: 0, color: { argb: `${cell.value}` } }
          ]
        }
        // cell.border = {
        //   top: { style: "double", color: { argb: `${cell.value}` } },
        //   left: { style: 'double', color: { argb: `${cell.value}` } },
        //   bottom: { style: 'double', color: { argb: `${cell.value}` } },
        //   right: { style: 'double', color: { argb: `${cell.value}` } }
        // }

        cell.value = ""
      });

      // 因为从头部行开始设置了颜色，所以删除掉最后一行，否则会导致多余一行
      if (rowIndex === pixelMatrix.length - 1) return
      this.worksheet.addRow(row)
    })
  }

  download() {
    this.workbook.xlsx.writeBuffer().then(function (data) {
      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "测试文件.xlsx";
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
    this.processor = new Processor(file)
  }

  async drawImage(): Promise<{ image: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }> {
    const base64 = await this.processor.getBase64()
    const canvas = document.querySelector('#img2excel-canvas') as HTMLCanvasElement || document.createElement('canvas')
    canvas.id = "img2excel-canvas"
    
    // canvas.style.top = "-10000px"
    // canvas.style.left = "-10000px"
    // canvas.style.position = "relative"

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