import React from "react"
import Icon from "@mdi/react"
import { mdiLogout } from '@mdi/js';
import "./Logout.css"

export interface LogoutProps {
    onLogoutClick: () => void
}

export default class Logout extends React.Component<LogoutProps> {
    render() {
        const { onLogoutClick } = this.props
        return (
            <div className="logout">
                <button className="logoutButton" type="button" onClick={onLogoutClick}>
                    <span className="logoutSpan">Logout</span>
                    <div className="logoutIcon">
                        <Icon path={mdiLogout} size={"1em"} />
                    </div>
                </button>
            </div>
        )
    }
}
