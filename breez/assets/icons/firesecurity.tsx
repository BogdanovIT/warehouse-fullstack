import Svg, { Path, Rect, Circle } from "react-native-svg";

const FireExt = ({ color = "#000000", size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Корпус огнетушителя (баллон) */}
        <Path 
            d="M9 7H15V16C15 18 13.5 19 12 19C10.5 19 9 18 9 16V7Z" 
            fill={color}
        />
        
        {/* Верхняя часть (головка) */}
        <Rect 
            x="10" y="4" width="4" height="3" 
            fill={color}
        />
        
        {/* Ручка */}
        <Path 
            d="M7 4L10 4.5M17 4L14 4.5" 
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        
        {/* Нижнее кольцо */}
        <Path 
            d="M8 19H16" 
            stroke={color}
            strokeWidth="1.5"
        />
        
        {/* Насадка (шланг) */}
        <Path 
            d="M18 13C19 13 19.5 12 19 11C18.5 10 17.5 10 17 10.5" 
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
        />
    </Svg>
);

export default FireExt;