import "./ErrorScreen.css"
import Icon from "@mdi/react"
import { mdiReload, mdiAlertOutline } from '@mdi/js'

export interface ErrorScreenProps {
    onReconnect: () => void
    reason?: ErrorReason
}

export type ErrorReason = "connectionFailed" | "disconnected"

export default function ErrorScreen({ onReconnect, reason }: ErrorScreenProps) {
    return (
        <div className="errorContainer">
            <p className="errorText">
                <span className="errorAlertIcon">
                    <Icon path={mdiAlertOutline} size={"1em"} />
                </span>
                {reason === "connectionFailed" ?
                    "Unable to connect to the server" :
                    reason === "disconnected" ?
                        "Connection to the server was lost" :
                        "There was an error"}
            </p>
            <button className="errorButton" type="button" onClick={onReconnect}>
                <Icon path={mdiReload} size={"1em"} />
                <span className="errorButtonText">Reconnect</span>
            </button>
        </div>
    )
}
