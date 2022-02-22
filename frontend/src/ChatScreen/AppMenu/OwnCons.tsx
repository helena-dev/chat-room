import "./OwnCons.css"
import Icon from "@mdi/react"
import { mdiWeb } from '@mdi/js';
import { Connection } from '../../../../messages';
import { formatRelativeDate, formatUserLocation } from "../../utils";

export interface OwnConsProps {
    connection: Connection
}

export default function OwnCons({ connection }: OwnConsProps) {

    const { region, countryCode, city } = connection.currentIP || {}
    const { bogon } = connection.currentIP as any || {}
    const lastActivityDate = new Date(connection.lastActivity)
    const onlineStatus = connection.online
    const currentDate = new Date()
    const userActivityInfo = [["online", "fancyText"], ["last seen " + formatRelativeDate(lastActivityDate, currentDate), "plainText"]]
    const position = onlineStatus ? 0 : 1
    const userActivity = (
        <span className={"ownConsActivity " + userActivityInfo[position][1]}>
            {userActivityInfo[position][0]}
        </span>
    )

    return (
        <div className="ownConsBiggestContainer">
            <div className="ownConsVertical">
                <Icon path={mdiWeb} size={"1em"} style={{color: connection.own ? "green" : "inherit"}}/>
                <div className="ownConsContainer">
                    {userActivity}
                    <span className="connectionLoc">
                        {formatUserLocation(region, countryCode, bogon, city)}
                    </span>
                    <span style={{fontWeight: 500}}>{connection.own ? "Current session" : undefined}</span>
                </div>
            </div>
        </div>
    )
}
