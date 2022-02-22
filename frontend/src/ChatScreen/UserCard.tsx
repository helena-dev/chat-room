import React from "react"
import { formatRelativeDate, formatUserLocation } from "../utils"
import { UserInfo } from "../../../messages"
import "./UserCard.css"

export interface UserCardProps {
    user: UserInfo,
    typingStatus: boolean
}

export default class UserCard extends React.Component<UserCardProps> {
    render() {
        const {user, typingStatus} = this.props

        const { region, countryCode, bogon, city } = user.ipInfo || {}
        const lastActivityDate = new Date(user.lastActivity)
        const onlineStatus = user.online
        const currentDate = new Date()
        const userActivityInfo = [["typing...", "fancyText"], ["online", "fancyText"], ["last seen " + formatRelativeDate(lastActivityDate, currentDate), "plainText"]]
        const position = typingStatus ? 0 : (onlineStatus ? 1 : 2)
        const userActivity = (
            <span className={"user-activity " + userActivityInfo[position][1]}>
                {userActivityInfo[position][0]}
            </span>
        )
        return (
            <div className="user">
                <div className="user-name-container">
                    <span className="user-name">
                        {user.name}
                    </span>
                    <span className="user-connected" style={{ backgroundColor: !user.connected ? "IndianRed" : "green" }}></span>
                </div>
                {userActivity}
                {user.ipInfo ?
                    <span className="user-loc">
                        {formatUserLocation(region, countryCode, bogon, city)}
                    </span> :
                    undefined
                }
            </div>
        )
    }
}
