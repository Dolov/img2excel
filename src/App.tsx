import { useState } from 'react'
import { Image2Excel } from './utils'


function App() {
  const [count, setCount] = useState(0)

  const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const image2Excel = new Image2Excel({ file })
    console.log('image2Excel: ', image2Excel);
  }

  return (
    <div>
      <input onChange={onChange} type="file" />
    </div>
  )
}

export default App
