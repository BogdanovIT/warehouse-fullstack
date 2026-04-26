import * as React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const FireExt = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {/* Корпус огнетушителя (баллон) */}
    <Path 
      d="M9 7H15V16C15 18 13.5 19 12 19C10.5 19 9 18 9 16V7Z" 
      fill={SystemColors.VeryLightBlue}
    />
    {/* Верхняя часть (головка) */}
    <Rect 
      x="10" y="4" width="4" height="3" 
      fill={SystemColors.VeryLightBlue}
    />
    {/* Ручка */}
    <Path 
      d="M7 4L10 4.5M17 4L14 4.5" 
      stroke={SystemColors.VeryLightBlue}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Нижнее кольцо */}
    <Path 
      d="M8 19H16" 
      stroke={SystemColors.VeryLightBlue}
      strokeWidth="1.5"
    />
    {/* Насадка (шланг) */}
    <Path 
      d="M18 13C19 13 19.5 12 19 11C18.5 10 17.5 10 17 10.5" 
      stroke={SystemColors.VeryLightBlue}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
)

export default FireExt