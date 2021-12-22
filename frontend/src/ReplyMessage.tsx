import React from "react"
import { ReceivedMessage } from "../../messages"
import "./ReplyMessage.css"

export interface ReplyMessageProps {
    data?: ReceivedMessage;
}

export default class ReplyMessageComponent extends React.Component<ReplyMessageProps> {
    render(): React.ReactNode {
        const { data } = this.props

        return (
            <div className="replyMessage" style={{ borderColor: data?.cssColor }}>
                <span className="reply-user" style={{ color: data?.cssColor }}>{data?.from}</span>
                <div className="reply-body">
                    <span className="reply-text">{data?.text}</span>
                </div>
            </div>
        )
    }
}
