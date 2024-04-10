import React from 'react';
import { Carousel } from 'antd';

const contentStyle: React.CSSProperties = {
  height: '200px',
  width: "300px",
  color: '#fff',
  lineHeight: '160px',
  textAlign: 'center',
};

const App: React.FC = () => (
  <Carousel effect="fade">
    <div>
      <img style={{ width: "100%", height: "100%" }} src="https://static-oss-files.oss-cn-beijing.aliyuncs.com/friends.png" alt="" />
    </div>
    <div>
      <h3 style={contentStyle}>2</h3>
    </div>
    <div>
      <h3 style={contentStyle}>3</h3>
    </div>
    <div>
      <h3 style={contentStyle}>4</h3>
    </div>
  </Carousel>
);

export default App;