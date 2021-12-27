import { mdiChevronDown, mdiProgressClock, mdiCheck } from "@mdi/js"
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
    windowWidth: number;
    onAction: () => void;
    nums: number[]
}

export default class Message extends React.Component<MessageProps> {
    messageRef = React.createRef<HTMLDivElement>()

    render() {
        const { data, followup, onMenu, reply, onAction, nums } = this.props
        let { windowWidth } = this.props
        if (windowWidth > 850) windowWidth = 850
        const [x1, x2] = [360, 850]
        const [y1, y2] = [60, 35]
        const m = (y2 - y1) / (x2 - x1)
        const b = y2 - m * x2
        const msgDate = new Date(data.date)
        let msgClass = "message"
        if (data.own) msgClass += " own"
        if (followup) msgClass += " followup"
        const imageHeight = data.image ? "100%" : "30vh"
        const imageWidth = (data.image || reply?.image) ? m * windowWidth + b + "%" : "75%"
        return (
            <div ref={this.messageRef} className={msgClass} style={{ maxWidth: imageWidth }} id={data.msgNum.toString()}>
                {(!data.own && !followup) ?
                    <span className="message-user" style={{ color: data.cssColor }}>{data.from}</span> :
                    null}
                <button className="msgMenuButton" type="button" onClick={() => onMenu(this.messageRef.current!)}>
                    <Icon path={mdiChevronDown} size={"1em"} />
                </button>
                {reply && nums.includes(reply.msgNum) ? <ReplyMessageComponent data={reply} inMessage={true} /> : undefined}
                <div className="message-body" style={{ maxHeight: imageHeight }}>
                    <span className="message-image" onClick={onAction}>
                        {data.image &&
                            <img src={data.image} decoding="async"></img>}
                    </span>
                    <div className="message-textTime-container">
                        <span className="message-text">{data.text}</span>
                        <div className="message-infoContainer">
                            <div className="message-time">{formatDate(msgDate)}</div>
                            {data.own ?
                                <span className="message-check">
                                    <Icon path={data.msgNum < 0 ? mdiProgressClock : mdiCheck} size={"1em"} />
                                </span> :
                                undefined
                            }

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
