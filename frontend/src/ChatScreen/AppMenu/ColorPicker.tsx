import React from "react"
import Icon from "@mdi/react"
import "./ColorPicker.css"
import { mdiPalette } from '@mdi/js';
import { rgbToHex, hexToRgb } from "../../utils"

export interface ColorPickerProps {
    onSubmit: (event: React.FormEvent<HTMLFormElement>, [red, green, blue]: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>]) => void
    currentColor: [number, number, number]
}

export interface ColorPickerState {
    color: string
    rgbColor: number[]
}

export default class ColorPicker extends React.Component<ColorPickerProps> {
    redInputRef = React.createRef<HTMLInputElement>()
    greenInputRef = React.createRef<HTMLInputElement>()
    blueInputRef = React.createRef<HTMLInputElement>()
    formRef = React.createRef<HTMLFormElement>()

    state: ColorPickerState = { color: `rgb(${this.props.currentColor})`, rgbColor: this.props.currentColor }
    render() {
        const { onSubmit, currentColor } = this.props
        const { color, rgbColor } = this.state
        const onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rgb = hexToRgb(parseInt(e.target.value.substring(1), 16))
            this.setState({ color: `rgb(${rgb})` });
            [this.redInputRef.current!.value, this.greenInputRef.current!.value, this.blueInputRef.current!.value] = rgb.map(x => x.toString())
        }

        const onColorNumber = () => {
            const [red, green, blue] = [this.redInputRef.current!, this.greenInputRef.current!, this.blueInputRef.current!]
            const rgb = [
                red.value || red.placeholder,
                green.value || green.placeholder,
                blue.value || blue.placeholder
            ]
            this.setState({ color: `rgb(${rgb})` });
        }
        return (
            <div className="colorContainer">
                <h3 className="colorTitle">Background Color</h3>
                <form ref={this.formRef} className="colorField" autoComplete="off" onSubmit={(event) => {
                    const colors: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>] = [this.redInputRef, this.greenInputRef, this.blueInputRef]
                    const rgb = colors.map(x => x.current?.value ? parseInt(x.current?.value) : parseInt(x.current!.placeholder))
                    this.setState({ color: `rgb(${rgb})` })
                    this.setState({ rgbColor: rgb })
                    onSubmit(event, colors)
                }}>
                    <div className="colorInputContainer">
                        <input ref={this.redInputRef} type="number" className="colorInput" placeholder={currentColor[0].toString()} min={0} max={255} step={1} onChange={onColorNumber} />
                        <input ref={this.greenInputRef} type="number" className="colorInput" placeholder={currentColor[1].toString()} min={0} max={255} step={1} onChange={onColorNumber} />
                        <input ref={this.blueInputRef} type="number" className="colorInput" placeholder={currentColor[2].toString()} min={0} max={255} step={1} onChange={onColorNumber} />
                    </div>
                    <label style={{ alignSelf: "center" }}>
                        <div className="colorPreview" style={{ backgroundColor: color }} />
                        <input type="color" className="colorPicker"
                            value={`#${rgbToHex(rgbColor).toString(16).padStart(6, "0")}`}
                            onChange={onColorChange}
                        />
                    </label>
                    <button className="colorButton" type="submit">
                        <Icon path={mdiPalette} size={"1em"} />
                        <span className="colorTip">RGB</span>
                    </button>
                </form>
            </div>
        )
    }
}
