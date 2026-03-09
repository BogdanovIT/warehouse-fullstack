import Svg, { Path, Circle } from "react-native-svg";
import { Colors, SystemColors } from "../../shared/tokens";

const FireExt = ({ color = "currentColor", size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Верхняя часть огнетушителя (колба) */}
        <Path 
            d="M12 3C8.5 3 5.5 5.5 5.5 9.5V16C5.5 18 7 20 9 20H15C17 20 18.5 18 18.5 16V9.5C18.5 5.5 15.5 3 12 3Z" 
            fill={color}
        />
        {/* Нижняя часть (основание) */}
        <Path 
            d="M9 20L8 22H16L15 20H9Z" 
            fill={color}
        />
        {/* Рычаг/ручка */}
        <Path 
            d="M14 8H10V10H14V8Z" 
            fill={color}
        />
        {/* Насадка/шланг (опционально) */}
        <Path 
            d="M16 13C16 14.5 14.5 16 12 16C9.5 16 8 14.5 8 13" 
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
    </Svg>
);

export default FireExt;