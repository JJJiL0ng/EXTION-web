interface useCommandMakerProps {
    dataEditCommand: string;
    range: string;
}

interface useCommandMakerReturns {
    makeCommand: string;
}

const useCommandMaker = ({dataEditCommand, range} : useCommandMakerProps) : useCommandMakerReturns => {
    if (dataEditCommand) {
        return {
            makeCommand: `sheet.setValue('${range}', ${dataEditCommand});`
        };
    }

    return {
        makeCommand: ''
    };
};

export default useCommandMaker;