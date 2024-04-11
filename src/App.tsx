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
    <div className='container'>
      <div style={{ background: "rgba(255,255,255,0.1)", width: "25%", margin: 24, padding: 24, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ flex: 1 }}>
          <Upload accept="image/*" limit={1} draggable onChange={onChange} beforeUpload={() => false}>
            <Button block icon={<IconUpload style={{ color: "white" }} />}>
              <span style={{ color: "white" }}>选择本地图片</span>
            </Button>
          </Upload>
          {image && (
            <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, fontWeight: "bold" }}>
              <div style={{ marginBottom: 36 }}>
                <h4 style={{ fontSize: 20, padding: "6px 0" }}>图片信息</h4>
                <div>图片宽：{image?.width} px</div>
                <div>图片高：{image?.height} px</div>
              </div>
              <div>
                <h4 style={{ fontSize: 20, padding: "6px 0" }}>设置压缩参数</h4>
                <div style={{ margin: "4px 0" }}>
                  <span style={{ paddingRight: 8 }}>压缩系数</span>
                  <InputNumber value={quality} onChange={quality => onCompressPropsChange({ quality })} />
                </div>
                <div style={{ margin: "4px 0" }}>
                  <span style={{ paddingRight: 8 }}>设置宽度</span>
                  <InputNumber value={width} onChange={width => onCompressPropsChange({ width })} />
                </div>
                <div style={{ margin: "4px 0" }}>
                  <span style={{ paddingRight: 8 }}>设置高度</span>
                  <InputNumber value={height} onChange={height => onCompressPropsChange({ height })} />
                </div>
              </div>
            </div>
          )}
        </div>
        <Button loading={loading} block onClick={start} style={{ color: "white", background: "#3e0f47" }}>开始生成</Button>
      </div>
      <div style={{ overflow: "auto", flex: 1, margin: "24px 24px 24px 0", padding: 24, background: "rgba(255,255,255,0.1)" }}>
        <img style={{ width: "100%", height: "98%" }} src="https://dotown.maeda-design-room.net/wp-content/uploads/2022/02/cat-guest.svg" alt="" />
      </div>
    </div>
  )
}

export default App
