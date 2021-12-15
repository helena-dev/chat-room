import React, { ReactNode } from "react"
import { Toast } from "../../messages"
import "./Toast.css"
import { assertUnreachable } from "./utils"

export interface ToastProps {
    data: Toast
}

export default class ToastComponent extends React.Component<ToastProps> {
    render() {
        const { data } = this.props
        let text: string
        if (data.toast === "userChange") {
            if (data.sign === "plus") {
                text = data.own ? "You are now online" : `${data.name} has just arrived`
            } else if (data.sign === "minus") {
                text = !data.own ? `${data.name} has left` : assertUnreachable()
            } else {
                assertUnreachable()
            }
        } else if (data.toast === "nickChange") {
            text = data.own ?
                `Your username is now: ${data.newName}` :
                `User "${data.oldName}" is now "${data.newName}"`
        } else if (data.toast === "punish") {
            text = data.text
        } else {
            assertUnreachable()
        }
        return (
            <div className="toast">
                <span className="toast-text">
                    {text}
                </span>
            </div>
        )
    }
}
