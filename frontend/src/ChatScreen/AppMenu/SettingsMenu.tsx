import React from "react"
import "./SettingsMenu.css"
import NickField from "./NickField";
import ColorPicker from "./ColorPicker";
import Password from "./Password";

export interface SettingsMenuProps {
    settingsDisappear: () => void
    currentNick?: string
    onNickSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    reference: React.RefObject<HTMLInputElement>
    onColorSubmit: (event: React.FormEvent<HTMLFormElement>, [red, green, blue]: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>]) => void
    currentColor: [number, number, number]
    changePassword: (arg0: string, arg1: string) => void
    changedPwd: boolean
    wrongPwd: boolean
}

export interface SettingsMenuState {
    diffPassword: boolean
}

export default class SettingsMenu extends React.Component<SettingsMenuProps> {
    state: SettingsMenuState = { diffPassword: false }
    diffPassTimeot: any
    cancelTimeout() {
        if (this.diffPassTimeot) {
            clearTimeout(this.diffPassTimeot)
            this.diffPassTimeot = undefined
        }
    }
    render() {
        const { settingsDisappear, currentNick, onNickSubmit, reference, onColorSubmit, currentColor, changePassword, changedPwd, wrongPwd } = this.props
        const { diffPassword } = this.state
        const visibility = changedPwd || wrongPwd || diffPassword ? "visible" : "hidden"
        const opacity = changedPwd || wrongPwd || diffPassword ? 1 : 0

        const diffentPasswords = () => {
            this.cancelTimeout()
            this.setState({ diffPassword: true })
            this.diffPassTimeot = setTimeout(() => {
                this.diffPassTimeot = undefined
                this.setState({ diffPassword: false })
            }, 2000)
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
                        <Password changePassword={changePassword} changedPwd={changedPwd} differentPasswords={diffentPasswords} />
                    </div>
                </div>
                <div className="settingsToast" style={{ visibility, opacity }}>
                    {wrongPwd ?
                        <span>Wrong Old Password</span> :
                        changedPwd ?
                            <span>Changed Password</span> :
                            diffPassword ?
                                <span>New passwords do not match</span> :
                                undefined
                    }
                </div>
            </div>
        )
    }
}
