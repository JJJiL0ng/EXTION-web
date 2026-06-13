import { postJson } from "@/shared/api/httpClient";
import { UploadSheetsReqDto, UploadSheetsResDto } from "../_sc-type/uploadSheets.types";

export const uploadSheetsAndMappingAPiConnector = async (dto: UploadSheetsReqDto): Promise<UploadSheetsResDto> => {
    const data = await postJson<UploadSheetsResDto, UploadSheetsReqDto>('/v2/schema-converter/uploadSheets', dto, {
        errorMessage: 'Error uploading sheets',
    });
    return data;
}
