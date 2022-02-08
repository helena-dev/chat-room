import React from "react"
import "./SettingsMenu.css"
import NickField from "./NickField";
import ColorPicker from "./ColorPicker";

export interface SettingsMenuProps {
    settingsDisappear: () => void
    currentNick?: string
    onNickSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    reference: React.RefObject<HTMLInputElement>
    onColorSubmit: (event: React.FormEvent<HTMLFormElement>, [red, green, blue]: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>]) => void
    currentColor: [number, number, number]
}


export default class SettingsMenu extends React.Component<SettingsMenuProps> {
    render() {
        const { settingsDisappear, currentNick, onNickSubmit, reference, onColorSubmit, currentColor} = this.props
}

        return (
            <div className="settingsMenuBkg" onClick={settingsDisappear}>
                <div className="settingsContainer" onClick={(event) => event.stopPropagation()}>
                    <div className="settingsTopBar">
                        <h2 className="settingsTitle">Settings</h2>
                    </div>
                    <div className="settingsBody">
                        <NickField currentNick={currentNick} onNickSubmit={onNickSubmit} reference={reference} />
                        <ColorPicker onSubmit={onColorSubmit} currentColor={currentColor} />
                    </div>
                </div>
            </div>
        )
    }
}
