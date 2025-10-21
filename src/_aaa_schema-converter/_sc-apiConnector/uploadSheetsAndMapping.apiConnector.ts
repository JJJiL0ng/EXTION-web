import { UploadSheetsReqDto, UploadSheetsResDto } from "../_sc-type/uploadSheets.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const uploadSheetsAndMappingAPiConnector = async (dto: UploadSheetsReqDto): Promise<UploadSheetsResDto> => {
    const response = await fetch(`${BASE_URL}/v2/schema-converter/uploadSheets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Error uploading sheets: ${response.statusText}`);
    }

    const data: UploadSheetsResDto = await response.json();
    return data;
}