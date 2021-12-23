import React from "react"
import { UserList } from "../../messages"
import "./SidePanel.css"
import UserCard from "./UserCard"

export interface SidePanelProps {
    windowWidth: number;
    currentUserList?: UserList;
    typingUsers: Map<string, NodeJS.Timeout>
}

export default class SidePanel extends React.Component<SidePanelProps> {
    render () {
        const {windowWidth, currentUserList, typingUsers} = this.props
        const size = windowWidth >= 1170 ? " wide" : " narrow"
        const sortUsers = Array.from(currentUserList?.users || [])
        const cards = sortUsers.sort((a, b) => a.own ? -1 : 0).map(user =>
            <UserCard user={user} typingStatus={typingUsers.has(user.name)} key={user.name} />)
        return (
            <div className={"sidePanelContainer" + size}>
                <div className={"sidePanel" + size}>
                    <header className={"upperSidePanel" + size}>
                        Users
                    </header>
                    <div className={"lowerSidePanel" + size}>
                        {cards}
                    </div>
                </div>
            </div>
        )
    }
}
