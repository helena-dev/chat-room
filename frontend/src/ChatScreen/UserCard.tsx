import React, { ReactNode } from "react"
import { formatDate } from "../utils"
import { exceptionalReservationsToISO, isoAlpha2ToSymbols } from "../geo"
import Icon from "@mdi/react"
import { mdiHome } from "@mdi/js"
import { UserInfo } from "../../../messages"
import "./UserCard.css"

export interface UserCardProps {
    user: UserInfo,
    typingStatus: boolean
}

export default class UserCard extends React.Component<UserCardProps> {
    render() {
        const {user, typingStatus} = this.props

        function formatUserLocation(region?: string, countryCode?: string, bogon?: boolean, city?: string): ReactNode {
            if (bogon) {
                return (
                    <>
                        <Icon path={mdiHome} size={"1em"} /><span> Local</span>
                    </>
                )
            } else if (countryCode) {
                const ISO = (region && (region in exceptionalReservationsToISO)) ? exceptionalReservationsToISO[region] : countryCode
                const symbols = isoAlpha2ToSymbols(ISO)
                return city ? `${symbols}, ${city}` : `${symbols}`
            } else {
                return "🏴‍☠️"
            }
        }

        const { region, countryCode, bogon, city } = user.ipInfo || {}
        const lastActivityDate = new Date(user.lastActivity)
        const onlineStatus = user.online
        const userActivityInfo = [["typing...", "fancyText"], ["online", "fancyText"], ["last seen " + formatDate(lastActivityDate), "plainText"]]
        const position = typingStatus ? 0 : (onlineStatus ? 1 : 2)
        const userActivity = (
            <span className={"user-activity " + userActivityInfo[position][1]}>
                {userActivityInfo[position][0]}
            </span>
        )
        return (
            <div className="user">
                <span className="user-name">
                    {user.name}
                </span>
                {userActivity}
                <span className="user-loc">
                    {formatUserLocation(region, countryCode, bogon, city)}
                </span>
            </div>
        )
    }
}
