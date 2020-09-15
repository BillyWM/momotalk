import React from "react";
import RomSelector from "/components/RomSelector.js";
import offsets from "/data/offsets.js";
import TableSelector from "./TableSelector";

/*
    Todo:
        groups of lines for one dialogue block
        even grouping same speaker?

        portraits
*/

let EditorRow = (props) => {

    let { location, originalText } = props;

    // address, original text, translation
    return (
        <div>
            <div>
                {location}
            </div>
            <div>
                {originalText}
            </div>
            <div>
                <input type="text"></input>
            </div>
        </div>
    )
}

//TODO: ROM iterator which allows just iteration prg portion

// this.props.characterTable
class EditorArea extends React.Component {

    // Find any 0xFF02 ..... 0xFF00 sequences
    // Returns
    //      array of {location: ..., string: .... } objects
    findStrings() {

        // 128KB PRG, 128KB CHR. Skip header then read only 128KB from there
        let endOfPRG = 16 + (128 * 1024);
        let i = 16;
        let strBytes = [];
        let foundStrings = [];
        let inStr = false;
        while (i < endOfPRG) {

            let strStart = null;
            let strEnd = null;

            let byte = this.props.romData[i];
            let nextByte = this.props.romData[i+1];

            if (byte === 0xFF && nextByte === 0x02) {
                strStart = i;
                inStr = true;
                i += 2;
            } else if (byte === 0xFF && nextByte === 0x00) {
                strEnd = i;
                inStr = false;
                if (strBytes.length) foundStrings.push({location: strStart, bytes: strBytes});
                strBytes = [];
                i += 2;
            } else {
                if (inStr) {
                    strBytes.push(byte);
                }    
                i++;
            }
        }

        return foundStrings;
    }

    // Convert byte sequence to displayable string using .tbl mapping
    convertWithTable(bytes) {
        console.log(bytes);
        let str = "";
        for (let byte of bytes) {
            if (this.props.characterTable.has(byte)) {
                str += this.props.characterTable.get(byte);
            } else {
                str += "_";
            }
        }

        return str;
    }

    render() {

        // console.log("editor received", this.props.romData);

        let foundStrings = this.findStrings();
        let rows = [];

        // in: {location, bytes }
        // out to row: location, originalText
        let i=0;
        for (let obj of foundStrings) {
            if (obj.bytes > 100) continue;
            let converted = this.convertWithTable(obj.bytes);
            rows.push(<EditorRow location={obj.location} originalText={converted} key={i} />)
            i++;
        }

        return (
            <div className="editor-area">
                {rows}
            </div>
        );    
    }

}

class Main extends React.Component {

    constructor() {
        super();

        let savedRomData = null;
        let savedTableFile = null;
        if (localStorage.romData) {
            savedRomData = this.stringToBuffer(localStorage.romData);
        }

        if (localStorage.tableFileContents) {
            savedTableFile = this.tableMappingFromString(localStorage.tableFileContents);
        }

        this.state = {
            romData: savedRomData,
            characterTable: savedTableFile
        };

        this.romSelectedHandler = this.romSelectedHandler.bind(this);
        this.tableSelectedHandler = this.tableSelectedHandler.bind(this);
        this.initFileLoad = this.initFileLoad.bind(this);
        this.loadTableFile = this.loadTableFile.bind(this);
        this.processRom = this.processRom.bind(this);
        this.processTableFile = this.processTableFile.bind(this);
    }

    bufferToString(buffer) {
        let str = "";
        for (let byte of buffer) {
            str += String.fromCharCode(byte);
        }

        return str;
    }

    stringToBuffer(str) {
        let buffer = new Uint8Array(str.length);
        for (let i=0; i < buffer.length; i++) {
            buffer[i] = str[i].charCodeAt(0);
        }

        return buffer;
    }

    romSelectedHandler(file) {
        this.initFileLoad(file, this.processRom);
    }

    tableSelectedHandler(file) {
        this.loadTableFile(file, this.processTableFile);
    }

    loadTableFile(file, callback) {
        console.log("load tbl", file)
        const reader = new FileReader();
        reader.addEventListener('load', (event) => callback(event.target.result));
        reader.readAsText(file);
    }

    tableMappingFromString(str) {
        // turn text file into entries in mapping
        let fileLines = str.split("\n");
        let characterTable = new Map();

        for (const line of fileLines) {

            // TODO: detect sequences longer than 2 bytes
            let match = line.match(/([A-Fa-f0-9]+)=(.+)/);

            if (match && match.length === 3) {
                let value = Number.parseInt(match[1], 16);
                let char = match[2];
                characterTable.set(value, char);
            }
        }

        return characterTable;
    }

    processTableFile(str) {
        console.log("process tbl file ", str);

        localStorage.tableFileContents = str;

        let characterTable = this.tableMappingFromString(str);

        this.setState({
            characterTable: characterTable
        })
    }

    initFileLoad(file, callback) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => callback(event.target.result));
        reader.readAsArrayBuffer(file);
    }

    processRom(buffer) {
        let romBytes = new Uint8Array(buffer);

        localStorage.romData = this.bufferToString(romBytes);

        this.setState({
            romData: romBytes
        })
    }

    render() {
        return (
            <div>
                <label htmlFor="romselector">Select ROM</label>
                <RomSelector id="romselector" selectHandler={this.romSelectedHandler} />

                <label htmlFor="tableselector">Select .tbl</label>
                <TableSelector id="tableselector" selectHandler={this.tableSelectedHandler} />

                <EditorArea romData={this.state.romData} characterTable={this.state.characterTable} />
            </div>
        )    
    }

}

export default Main;