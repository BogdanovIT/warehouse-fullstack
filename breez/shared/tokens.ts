import { Platform, PlatformColor } from "react-native"

export const Colors = {
    veryDarkBlue: "#021B2F",
    darkBlue: "#0B385A",
    blue: "#1C88C0",
    lightBlue: "#2DBAE1",
    veryLightBlue: "#90E6FF"
}

export const Gaps = {
    g16: 16,
    g50: 50
}

export const CustomFonts = {
  regular: "HelveticaRegular",
  medium: "HelveticaMedium",
  bold: "HelveticaBold"
}

export const FontSize = {
  Head_H1: "20"
}

export const SystemColors = {
    PrimaryBlue: Platform.select ({
        ios: "#5856D6",
        android: "#092147", //#1A237E
        default: "#02182E" //#092147
    }),

    LightBlue: Platform.select({
        ios: '#5AC8FA',     
        android: '#2196F3', 
        default: '#55A2D3', 
      }),
    
    MutedBlue: Platform.select({
        ios: '#7D7DFF',     // iOS systemIndigo (смещен в фиолетовый)
        android: '#1A488E', // #1976D2
        default: '#6499C1', // #1A488E
      }),
    
    VeryLightBlue: Platform.select({
        ios: '#AFEEEE',     // iOS systemMint (немного другой оттенок)
        android: '#97B2DE', //#B3E5FC 
        default: '#AFD3EA',  //#97B2DE
      })
}

// #1B4F83  #55A2D3  #6499C1  #84B8DB  #AFD3EA
