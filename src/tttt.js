const getWidth = (width) => {

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

  return compressedWidth
}

const a = getWidth(500)
console.log('a: ', a);