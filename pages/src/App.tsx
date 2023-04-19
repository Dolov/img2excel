import React from 'react'
import example from '../images/WX20230419-151917@2x.png'
import './style.less'
import Button from './Button'


const App = () => {
	const [hidden, setHidden] = React.useState(false)
	const [text, setText] = React.useState("上传图片")
	const animating = React.useRef(false)

	const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async e => {
		const file = e.target.files?.[0]
		if (!file) return
		animating.current = true
		setHidden(true)
		const formData = new FormData();
		formData.append('file', file);
		formData.append('fileName', file.name);

		/** 上传文件至 S3 */
		const uploadRes = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		})
			.then(res => res.json())
			.catch(err => {
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
				alert('excel 生成失败')
			})
		download(excelRes?.Payload?.data?.Bucket, excelRes?.Payload?.data?.Key)
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

	const onComplete = () => {
		setHidden(false)
	}

	return (
		<div id='container'>
			<div className='main'>
				<div className='content'>
					<div className='title'>将图片以像素点的模式插入到 excel 中，生成 excel 文件，支持下载</div>
					<div>
						<input
							onChange={onFileChange}
							type="file"
							id="upload-input"
							style={{ display: "none" }}
						/>
						<Button hidden={hidden} onComplete={onComplete}>
							<div onClick={e => e.stopPropagation()} className='trigger-container'>
								<label htmlFor="upload-input">
									{text}
								</label>
							</div>
						</Button>
					</div>
				</div>
				<img src={example} alt="" />
			</div>
		</div>
	)
}

export default App
