import React from "react"
import Icon from "@mdi/react"
import { mdiReply, mdiDelete, mdiPencil } from "@mdi/js"
import { ReceivedMessage } from "../../messages"
import "./MessageMenu.css"

interface MenuData {
    position: {
        top: number,
        left?: number,
        right?: number,
    }
    message: ReceivedMessage,
}

export interface MessageMenuProps {
    menuData: MenuData
    onDelete: (i: number, own: boolean) => void
    onReply: (data: ReceivedMessage) => void
    onEdit: (data: ReceivedMessage) => void
    disappear: () => void

}

export default class MessageMenu extends React.Component<MessageMenuProps> {
    render() {
        const { menuData, onDelete, onReply, onEdit, disappear } = this.props
        const {message: data, position} = menuData
        const delButton = (
            <button className="actionMsgButton" type="button" onClick={() => onDelete(data.msgNum, data.own)}>
                <Icon path={mdiDelete} size={"1em"} />
                <span className="actionMsgButtonName">Delete</span>
            </button>
        )
        const replyButton = (
            <button className="actionMsgButton" type="button" onClick={() => onReply(data)}>
                <Icon path={mdiReply} size={"1em"} />
                <span className="actionMsgButtonName">Reply</span>
            </button>
        )
        const editButton = (
            <button className="actionMsgButton" type="button" onClick={() => onEdit(data)}>
                <Icon path={mdiPencil} size={"1em"} />
                <span className="actionMsgButtonName">Edit</span>
            </button>
        )
        return (
            <div className="messageMenuBkg" onClick={disappear}>
                <div className="messageMenu" style={position}>
                    {replyButton}
                    {data.own ? editButton : undefined}
                    {data.own ? delButton : undefined}
                </div>
            </div>
        )
    }
}
