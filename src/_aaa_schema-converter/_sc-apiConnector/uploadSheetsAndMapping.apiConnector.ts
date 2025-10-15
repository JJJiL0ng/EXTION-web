import { UploadSheetsReqDto, UploadSheetsResDto } from "../_sc-type/uploadSheets.types";

export const uploadSheetsAndMappingAPiConnector = async (dto: UploadSheetsReqDto): Promise<UploadSheetsResDto> => {
    const response = await fetch('/v2/schema-converter/uploadSheets', {
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