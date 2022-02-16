import React from "react"
import Icon from "@mdi/react"
import { mdiCog } from '@mdi/js';
import "./Settings.css"

export interface SettingsProps {
    onSettingsClick: () => void
}

export default class Settings extends React.Component<SettingsProps> {
    render() {
        const { onSettingsClick } = this.props

        return (
            <div className="settings">
                <button className="settingsButton" type="button" onClick={onSettingsClick}>
                    <div className="settingsIcon">
                        <Icon path={mdiCog} size={"1em"} />
                    </div>
                    <span className="settingsSpan">Settings</span>
                </button>
            </div>
        )
    }
}
