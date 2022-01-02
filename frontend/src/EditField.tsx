import { mdiClose, mdiPencil } from "@mdi/js"
import Icon from "@mdi/react"
import React from "react"
import { ReceivedMessage } from "../../messages"
import ReplyMessageComponent from "./ReplyMessage"
import "./EditField.css"

export interface EditFieldProps {
    data: ReceivedMessage
    onAction: () => void
}

export default class EditField extends React.Component<EditFieldProps> {
    render() {
        const { data, onAction } = this.props
        return (
            <div className="editContainer">
                <div className="editingInfo">
                    <Icon path={mdiPencil} size={"1em"} />
                    <span>Editing...</span>
                </div>
                <div className="editField">
                    <ReplyMessageComponent data={data} />
                    <button className="closeEditButton" type="button" onClick={onAction}>
                        <Icon path={mdiClose} size={"1em"} />
                    </button>
                </div>
            </div>
        )
    }
}
