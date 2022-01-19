import React from "react"
import { ReceivedMessage } from "../../../../messages"
import "./ReplyMessage.css"

export interface ReplyMessageProps {
    data: ReceivedMessage;
    inMessage?: boolean;
}

export default class ReplyMessageComponent extends React.Component<ReplyMessageProps> {
    render(): React.ReactNode {
        const { data, inMessage } = this.props
        const imageHeight = data.image ? "50vh" : "30vh"
        const imageWidth = (data.image && !inMessage) ? "50%" : "100%"
        const width = !inMessage ? "75%" : "auto"
        return (
            <div className="replyMessage" style={{ borderColor: data.cssColor, maxWidth: imageWidth, width }}>
                <span className="reply-user" style={{ color: data.cssColor }}>{data.from}</span>
                <div className="reply-body" style={{ maxHeight: imageHeight }}>
                    <span className="reply-image">
                        {data.image &&
                            <img src={data.image.toString()} decoding="async"></img>}
                    </span>
                    <span className="reply-text">{data.text}</span>
                </div>
            </div>
        )
    }
}
