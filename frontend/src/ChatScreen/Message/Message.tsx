import { mdiChevronDown, mdiProgressClock, mdiCheck } from "@mdi/js"
import Icon from "@mdi/react"
import React from "react"
import Markdown from 'markdown-to-jsx'
import { ReceivedMessage } from "../../../../messages"
import "./Message.css"
import ReplyMessageComponent from "./ReplyMessage"
import { formatDate } from "../../utils"

export interface MessageProps {
    data: ReceivedMessage;
    followup: boolean;
    onMenu: (element: HTMLDivElement) => void;
    reply?: ReceivedMessage;
    windowWidth: number;
    onAction: () => void;
    showButton: boolean;
    replyClick: (msgNum: number) => void
}

export interface MessageState {
    opacityBool: boolean
}

export default class Message extends React.Component<MessageProps> {
    messageRef = React.createRef<HTMLDivElement>()

    state: MessageState = { opacityBool: false }

    render() {
        const { data, followup, onMenu, reply, onAction, showButton, replyClick } = this.props
        const { opacityBool } = this.state
        let { windowWidth } = this.props
        if (windowWidth > 850) windowWidth = 850
        const [x1, x2] = [360, 850]
        const [y1, y2] = [60, 35]
        const m = (y2 - y1) / (x2 - x1)
        const b = y2 - m * x2
        const msgDate = new Date(data.date)
        let msgClass = "message"
        let containerClass = "messageContainer"
        if (data.own) {msgClass += " own"; containerClass += " own"}
        if (followup) containerClass += " followup"
        const imageHeight = data.image ? "100%" : "30vh"
        const imageWidth = (data.image || reply?.image) ? m * windowWidth + b + "%" : "75%"
        const opacity = (showButton || opacityBool) ? 1 : 0
        return (
            <div className={containerClass}>
                <div ref={this.messageRef} className={msgClass} style={{ maxWidth: imageWidth }} id={data.msgNum.toString()}>
                    {(!data.own && !followup) ?
                        <span className="message-user" style={{ color: data.cssColor }}>{data.from}</span> :
                        null}
                    <button className="msgMenuButton" name="msgMenuButton" style={{ opacity }} type="button"
                        onClick={() => onMenu(this.messageRef.current!)}
                        onMouseOver={() => this.setState({ opacityBool: true })}
                        onMouseOut={() => this.setState({ opacityBool: false })}>
                        <Icon path={mdiChevronDown} size={"1em"} />
                    </button>
                    {reply ? <ReplyMessageComponent data={reply} inMessage={true} replyClick={replyClick} /> : undefined}
                    <div className="message-body" style={{ maxHeight: imageHeight }}>
                        <span className="message-image" onClick={onAction}>
                            {data.image &&
                                <img src={data.image} decoding="async"></img>}
                        </span>
                        <div className="message-textTime-container">
                            <span className="message-text"><Markdown options={{ disableParsingRawHTML: true, forceInline: true }}>{data.text}</Markdown></span>
                            <div className="message-infoContainer">
                                {data.edited ? <span className="message-edited">edited</span> : undefined}
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
            </div>
        )
    }
}
