import { mdiChevronDown } from "@mdi/js"
import Icon from "@mdi/react"
import React from "react"
import { ReceivedMessage } from "../../messages"
import "./Message.css"
import { formatDate } from "./utils"

export interface MessageProps {
    data: ReceivedMessage
    followup: boolean
    onMenu: (element: HTMLDivElement) => void
}

export default class Message extends React.Component<MessageProps> {
    messageRef = React.createRef<HTMLDivElement>()

    render() {
        const { data, followup, onMenu } = this.props
        const msgDate = new Date(data.date)
        let msgClass = "message"
        if (data.own) msgClass += " own"
        if (followup) msgClass += " followup"
        return (
            <div ref={this.messageRef} className={msgClass} id={data.msgNum.toString()}>
                {(!data.own && !followup) ?
                    <span className="message-user" style={{ color: data.cssColor }}>{data.from}</span> :
                    null}
                <button className="msgMenuButton" type="button" onClick={() => onMenu(this.messageRef.current!)}>
                    <Icon path={mdiChevronDown} size={"1em"} />
                </button>
                <div className="message-body">
                    <span className="message-text">{data.text}</span>
                    <div className="message-time">{formatDate(msgDate)}</div>
                </div>
            </div>
        )
    }
}
