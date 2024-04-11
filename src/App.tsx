import React from 'react'
import { Upload, Button } from '@douyinfe/semi-ui';
import { UploadProps } from '@douyinfe/semi-ui/lib/es/upload'
import { IconUpload } from '@douyinfe/semi-icons';
import { InputNumber } from '@douyinfe/semi-ui';
import { Image2Excel, ImageProcessor, recommendQuality, recommendSize } from './utils'

function App() {

  const fileRef = React.useRef<File>()
  const [loading, setLoading] = React.useState(false)
  const [image, setImage] = React.useState<HTMLImageElement>()
  const [compressorProps, setCompressorProps] = React.useState<{
    width: number,
    height: number,
    quality: number
  }>()

  const onChange: UploadProps["onChange"] = async object => {
    const { currentFile, fileList } = object
    if (!fileList.length) {
      setImage(undefined)
      setCompressorProps(undefined)
      fileRef.current = undefined
      return
    }
    if (currentFile.status !== "uploading") return
    if (!currentFile) return
    const { fileInstance: file } = currentFile
    if (!file) return
    fileRef.current = file
    const image = await ImageProcessor.getImage(file)
    const { width, height } = recommendSize(image)
    setImage(image)
    setCompressorProps({
      width,
      height,
      quality: recommendQuality(file.size),
    })
  }

  const start = () => {
    if (!fileRef.current) return
    setLoading(true)
    const image2Excel = new Image2Excel({
      file: fileRef.current!,
      compressorProps,
      worksheets: [
        "background",
        "border-double",
      ],
    })
    image2Excel.init().then(res => {
      setLoading(false)
    })
  }

  const onCompressPropsChange = (props: any) => {
    setCompressorProps({
      ...compressorProps!,
      ...props,
    })
  }

  const { width, height, quality } = compressorProps || {}

  return (
    <div className="flex overflow-auto h-full">
      <div className="w-full sm:w-1/4 m-6 p-6 flex flex-col overflow-auto bg-slate-100 bg-opacity-10">
        <div className="flex-1 flex flex-col">
          <Upload accept="image/*" limit={1} draggable onChange={onChange} beforeUpload={() => false}>
            <Button
              block
              icon={<IconUpload className="text-slate-200" />}
              className="h-16 mb-6 bg-slate-600 bg-opacity-30 hover:!bg-slate-600 hover:!bg-opacity-40"
            >
              <span className="text-slate-200">选择本地图片</span>
            </Button>
          </Upload>
          {!image && (
            <div className="flex flex-1 justify-center">
              <img className="h-full w-3/4" src="https://dotown.maeda-design-room.net/wp-content/uploads/2022/02/cat-guest.svg" alt="" />
            </div>
          )}
          {image && (
            <div className="font-bold text-sm text-slate-200">
              <div className="mb-9">
                <h4 className="text-xl py-2">图片信息</h4>
                <div>图片宽：{image?.width} px</div>
                <div>图片高：{image?.height} px</div>
              </div>
              <div>
                <h4 className="text-xl py-2">设置压缩参数</h4>
                <div className="my-1">
                  <span className="pr-2">压缩系数</span>
                  <InputNumber value={quality} onChange={quality => onCompressPropsChange({ quality })} />
                </div>
                <div className="my-1">
                  <span className="pr-2">设置宽度</span>
                  <InputNumber value={width} onChange={width => onCompressPropsChange({ width })} />
                </div>
                <div className="my-1">
                  <span className="pr-2">设置高度</span>
                  <InputNumber value={height} onChange={height => onCompressPropsChange({ height })} />
                </div>
              </div>
            </div>
          )}
        </div>
        <Button
          block
          loading={loading}
          onClick={start}
          className="!text-slate-200 bg-[#3e0f47] bg-opacity-20 hover:!bg-[#3e0f47] hover:!bg-opacity-90"
        >
          开始生成
        </Button>
      </div>
      <div className="hidden sm:block flex-1 p-6 bg-slate-100 bg-opacity-10 m-6 ml-0">
        <img className="w-full h-full object-cover" src="https://static-oss-files.oss-cn-beijing.aliyuncs.com/WX20240411-215256%402x.png" alt="" />
      </div>
    </div>
  )
}

export default App
