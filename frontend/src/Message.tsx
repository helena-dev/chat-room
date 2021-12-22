import { mdiChevronDown } from "@mdi/js"
import Icon from "@mdi/react"
import React from "react"
import { ReceivedMessage } from "../../messages"
import "./Message.css"
import ReplyMessageComponent from "./ReplyMessage"
import { formatDate } from "./utils"

export interface MessageProps {
    data: ReceivedMessage;
    followup: boolean;
    onMenu: (element: HTMLDivElement) => void;
    reply?: ReceivedMessage;
}

export default class Message extends React.Component<MessageProps> {
    messageRef = React.createRef<HTMLDivElement>()

    render() {
        const { data, followup, onMenu, reply } = this.props
        const msgDate = new Date(data.date)
        let msgClass = "message"
        if (data.own) msgClass += " own"
        if (followup) msgClass += " followup"
        const imageHeight = data.image ? "100%" : "30vh"
        const imageWidth = (data.image || reply?.image) ? "50%" : "75%"
        return (
            <div ref={this.messageRef} className={msgClass} style={{ maxWidth: imageWidth }} id={data.msgNum.toString()}>
                {(!data.own && !followup) ?
                    <span className="message-user" style={{ color: data.cssColor }}>{data.from}</span> :
                    null}
                <button className="msgMenuButton" type="button" onClick={() => onMenu(this.messageRef.current!)}>
                    <Icon path={mdiChevronDown} size={"1em"} />
                </button>
                {reply ? <ReplyMessageComponent data={reply} inMessage={true} /> : undefined}
                <div className="message-body" style={{ maxHeight: imageHeight }}>
                    <span className="message-image">
                        {data.image &&
                            <img src={data.image} decoding="async"></img>}
                    </span>
                    <span className="message-text">{data.text}</span>
                    <div className="message-time">{formatDate(msgDate)}</div>
                </div>
            </div>
        )
    }
}
