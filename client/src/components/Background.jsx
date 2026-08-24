import React from 'react' 
import Ballpit from './Ballpit'
const Background = () => {
  return (
   
      <div style={{position: 'relative', overflow: 'hidden', minHeight: '500px', maxHeight: '500px', width: '100%'}}>
  <Ballpit
    count={100}
    gravity={0.01}
    friction={0.9975}
    wallBounce={0.95}
    followCursor={false}
  />
</div>
   
  )
}

export default Background

