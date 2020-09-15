import React from "react";

class RomSelector extends React.Component {

    constructor() {
        super();

        this.fileSelectedHandler = this.fileSelectedHandler.bind(this);
    }

    // TODO for eventual release: validate by checking it has an iNES header
    fileSelectedHandler(event) {
        let files = event.target.files;

        if (files.length === 1) {
            this.props.selectHandler(files[0]);
        } else {
            console.error("Must select only one file");
        }
    }

    render() {
        return (
            <div>
                <input type="file" accept=".nes" onChange={this.fileSelectedHandler}></input>
            </div>
        )
    }
}





export default RomSelector;