import React from "react"
import Icon from "@mdi/react"
import { mdiAccountEdit } from '@mdi/js';
import "./NickField.css"

export interface NickFieldProps {
    currentNick?: string
    onNickSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    reference: React.RefObject<HTMLInputElement>
}

export default class NickField extends React.Component<NickFieldProps> {
    render() {
        const { onNickSubmit, currentNick, reference} = this.props
        return (
            <form className="nickField" autoComplete="off" onSubmit={onNickSubmit}>
                <input ref={reference} type="text" className="nickInput" placeholder={currentNick || "Write your nick"} maxLength={20} />
                <button className="nickButton" type="submit">
                    <Icon path={mdiAccountEdit} size={"1em"} />
                </button>
            </form>
        )
    }
}
