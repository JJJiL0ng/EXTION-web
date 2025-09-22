import GC from '@mescius/spread-sheets';
import createUniqueSheetName from './createUniqueSheetName';

interface AddNewSheetProps {
    sheetName: string;
    spread: any;
}

interface AddNewSheetReturn {
    uniqueSheetName: string;
}

const addNewSheet = ({ sheetName, spread }: AddNewSheetProps):  AddNewSheetReturn => {

    let uniqueSheetName = '';

      if (!sheetName || sheetName.trim() === "") {
        uniqueSheetName = 'Extion Sheet';
    } else {
    uniqueSheetName = createUniqueSheetName(sheetName, spread);
    }
    const newSheet = new GC.Spread.Sheets.Worksheet(uniqueSheetName);
    spread.addSheet(spread.getSheetCount(), newSheet);
    spread.setActiveSheetIndex(spread.getSheetCount() - 1);
    spread.resumePaint();

    console.log('asdfasfsafasff&&&&:', uniqueSheetName);
    return {uniqueSheetName};   
}

export default addNewSheet;