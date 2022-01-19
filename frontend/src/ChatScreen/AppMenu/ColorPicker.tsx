import React from "react"
import Icon from "@mdi/react"
import "./ColorPicker.css"
import { mdiPalette } from '@mdi/js';

export interface ColorPickerProps {
    onSubmit: (event: React.FormEvent<HTMLFormElement>, [red, green, blue]: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>]) => void
    currentColor: [number, number, number]
}

export default class ColorPicker extends React.Component<ColorPickerProps> {
    redInputRef = React.createRef<HTMLInputElement>()
    greenInputRef = React.createRef<HTMLInputElement>()
    blueInputRef = React.createRef<HTMLInputElement>()
    render() {
        const { onSubmit, currentColor } = this.props
        return (
            <form className="colorField" autoComplete="off" onSubmit={(event) => onSubmit(event, [this.redInputRef, this.greenInputRef, this.blueInputRef])}>
                <div className="colorInputContainer">
                    <input ref={this.redInputRef} type="number" className="colorInput" placeholder={currentColor[0].toString()} min={0} max={255} step={1} />
                    <input ref={this.greenInputRef} type="number" className="colorInput" placeholder={currentColor[1].toString()} min={0} max={255} step={1} />
                    <input ref={this.blueInputRef} type="number" className="colorInput" placeholder={currentColor[2].toString()} min={0} max={255} step={1} />
                </div>
                <button className="colorButton" type="submit">
                    <Icon path={mdiPalette} size={"1em"} />
                    <span className="colorTip">RGB</span>
                </button>
            </form>
        )
    }
}
