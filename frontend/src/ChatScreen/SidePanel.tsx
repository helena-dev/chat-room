import React from "react"
import { UserInfo, UserList } from "../../../messages"
import "./SidePanel.css"
import UserCard from "./UserCard"

export interface SidePanelProps {
    windowWidth: number;
    currentUserList?: UserList;
    typingUsers: Map<number, NodeJS.Timeout>
}

export default class SidePanel extends React.Component<SidePanelProps> {
    render() {
        const { windowWidth, currentUserList, typingUsers } = this.props
        const size = windowWidth >= 1170 ? " wide" : " narrow"
        const comparator = (a: UserInfo, b: UserInfo) => {
            if (a.own !== b.own) {
                return - (Number(a.own) - Number(b.own))
            }
            if (a.connected !== b.connected) {
                return - (Number(a.connected) - Number(b.connected))
            }
            if (a.online !== b.online) {
                return - (Number(a.online) - Number(b.online))
            }
            if (a.lastActivity !== b.lastActivity) {
                return - (Number(a.lastActivity) - Number(b.lastActivity))
            }
            return 0
        }
        const users = Array.from(currentUserList?.users || []).sort(comparator)
        const cards = users.map(user =>
            <UserCard user={user} typingStatus={typingUsers.has(user.id)} key={user.id} />)
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
