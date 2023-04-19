import React from 'react'
// @ts-ignore
import Compress from 'compress.js'
import Button from './Button'
import example from '../images/WX20230419-151917@2x.png'
import loadingSvg from '../images/loading.svg'
import './style.less'

const compress = new Compress()

const App = () => {
	const [hidden, setHidden] = React.useState(false)
	const [text, setText] = React.useState("上传图片")
	const [loading, setLoading] = React.useState(false)

	const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async e => {
		const file = e.target.files?.[0]
		if (!file) return
		setLoading(true)
		setTimeout(() => {
			setHidden(true)
		}, 300)
		let compressedFile = file
		const original = localStorage.getItem('compress') === "false"
		if (!original) {
			console.time("客户端压缩耗时")
			// 图片压缩
			const [img1] = await compress.compress([file], {
				size: 4, // the max size in MB, defaults to 2MB
				quality: .75, // the quality of the image, max is 1,
				maxWidth: 10000, // the max width of the output image, defaults to 1920px
				maxHeight: 10000, // the max height of the output image, defaults to 1920px
				resize: true, // defaults to true, set false if you do not want to resize the image width and height
				rotate: false, // See the rotation section below
			})
			compressedFile = Compress.convertBase64ToFile(img1.data, img1.ext)
			console.timeEnd("客户端压缩耗时")
			console.log(`压缩前体积：${file.size/1024/1024}，压缩后体积：${compressedFile.size/1024/1024}`)
		}
		
		const formData = new FormData();
		formData.append('file', compressedFile);
		formData.append('fileName', file.name);

		/** 上传文件至 S3 */
		const uploadRes = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		})
			.then(res => res.json())
			.catch(err => {
				setLoading(false)
				alert('上传失败')
			})
		const { Bucket, Key } = uploadRes || {}
		if (!Key) return

		/** 生成 excel 文件 */
		const excelRes = await fetch('/api/excel', {
			method: 'POST',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				Key,
				Bucket,
			})
		})
			.then(res => res.json())
			.catch(err => {
				setLoading(false)
				alert('excel 生成失败')
			})
		
		await download(excelRes?.Payload?.data?.Bucket, excelRes?.Payload?.data?.Key)
		setLoading(false)
	}

	const download = async (Bucket: string, Key: string) => {
		if (!Key) return
		const blob = await fetch(`/api/download?Bucket=${Bucket}&Key=${Key}`).then(res => res.blob())
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = Key;
		link.click();
		link.parentNode?.removeChild?.(link)
	}

	/** 请求结束且动画结束则重置 */
	React.useEffect(() => {
		if (loading) return
		if (!hidden) return
		setHidden(false)
	}, [loading])

	/** 动画完成且请求结束则重置动画 */
	const onComplete = () => {
		if (loading) return
		setHidden(false)
	}

	return (
		<div id='container'>
			<div className='main'>
				<a className='github' target='_blank' href="https://github.com/Dolov/img-pixel-to-excel">github</a>
				<div className='content'>
					<div className='title'>将图片以像素点的模式插入到 excel 中，生成 excel 文件并下载</div>
					<div className='button-container'>
						<input
							id="upload-input"
							type="file"
							style={{ display: "none" }}
							accept="image/*"
							onChange={onFileChange}
						/>
						<img className='loading' src={loadingSvg} alt="" style={{ "visibility": loading ? "visible": "hidden" }} />
						<Button hidden={hidden} onComplete={onComplete}>
							<div className='trigger-container'>
								<label htmlFor="upload-input">
									{text}
								</label>
							</div>
						</Button>
					</div>
				</div>
				<img className='bg' src={example} alt="" />
			</div>
		</div>
	)
}

export default App
