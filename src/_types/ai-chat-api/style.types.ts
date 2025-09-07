
export interface StyleCommand {
    method: "style_object" | "direct_method"; // named_style 제거
    properties: StyleProperties;
}

export interface StyleProperties {
    // 색상 관련
    backColor?: string;
    foreColor?: string;
    
    // 글꼴 관련
    font?: string;
    fontFamily?: string;
    fontSize?: string;
    fontStyle?: string;
    fontWeight?: string;
    
    // 정렬 관련
    hAlign?: "left" | "center" | "right" | "fill" | "justify";
    vAlign?: "top" | "center" | "bottom" | "justify";
    textIndent?: number;
    textOrientation?: number;
    isVerticalText?: boolean;
    
    // 테두리 관련
    borderLeft?: BorderInfo;
    borderTop?: BorderInfo;
    borderRight?: BorderInfo;
    borderBottom?: BorderInfo;
    diagonalDown?: BorderInfo;
    diagonalUp?: BorderInfo;
    
    // 텍스트 표시 관련
    wordWrap?: boolean;
    shrinkToFit?: boolean;
    showEllipsis?: boolean;
    textDecoration?: "none" | "underline" | "overline" | "lineThrough";
    
    // 보호 관련
    locked?: boolean;
    hidden?: boolean;
    
    // 기타
    formatter?: string;
    backgroundImage?: string;
    cellPadding?: string;
    watermark?: string;
}

export interface BorderInfo {
    color: string;
    style: "empty" | "thin" | "medium" | "thick" | "double" | "dotted" | "dashed";
}