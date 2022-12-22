import React from "react"
import { ReceivedMessage } from "../../../../messages"
import "./ReplyMessage.css"
import Markdown from 'markdown-to-jsx'

export interface ReplyMessageProps {
    data: ReceivedMessage;
    inMessage?: boolean;
    replyClick?: (msgNum: number) => void
}

export default class ReplyMessageComponent extends React.Component<ReplyMessageProps> {
    render(): React.ReactNode {
        const { data, inMessage, replyClick } = this.props
        const imageHeight = data.image ? "50vh" : "30vh"
        const imageWidth = (data.image && !inMessage) ? "50%" : "100%"
        const width = !inMessage ? "75%" : "auto"
        let cursor
        if (inMessage) {
            cursor = "pointer"
        }
        return (
            <div className="replyMessage" onClick={() => { if (replyClick) replyClick(data.msgNum) }} style={{ cursor, borderColor: data.cssColor, maxWidth: imageWidth, width }}>
                <span className="reply-user" style={{ color: data.cssColor }}>{data.user_name}</span>
                <div className="reply-body" style={{ maxHeight: imageHeight }}>
                    <span className="reply-image">
                        {data.image &&
                            <img src={data.image.toString()} decoding="async"></img>}
                    </span>
                    <span className="reply-text" onClick={(event) => event.preventDefault()}>
                        <Markdown options={{
                            disableParsingRawHTML: true,
                            forceInline: true,
                        }}>
                            {data.text}
                        </Markdown>
                    </span>
                </div>
            </div>
        )
    }
}
