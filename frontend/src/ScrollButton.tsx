import React from "react"
import { mdiChevronDown } from "@mdi/js"
import Icon from "@mdi/react"
import "./ScrollButton.css"

export interface ScrollButtonProps {
    onAction: () => void;
    scroll: number;
}

export default class ScrollButton extends React.Component<ScrollButtonProps> {
    render() {
        const { onAction, scroll } = this.props
        const visibility = scroll ? "visible" : "hidden"
        return (
            <div className="scrollButtonContainer" style={{ visibility }}>
                <button className="scrollButton" type="button" onClick={onAction}>
                    <Icon path={mdiChevronDown} size={"1em"} />
                </button>
            </div>
        )
    }
}
