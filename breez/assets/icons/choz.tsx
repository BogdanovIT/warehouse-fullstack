import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const ChozRabota = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    {/* Планшет */}
    <Path 
      fill={SystemColors.VeryLightBlue} 
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"
    />
    {/* Галочка */}
    <Path 
      fill={SystemColors.VeryLightBlue} 
      d="M10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42z"
    />
  </Svg>
)

export default ChozRabota