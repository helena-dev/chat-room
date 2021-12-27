import React from "react"
import Icon from "@mdi/react"
import { mdiDotsVertical } from '@mdi/js';
import "./AppMenu.css"

export interface AppMenuProps {
    AppMenuAction: () => void;
    show: boolean;
    childs: JSX.Element[];
}

export default class AppMenu extends React.Component<AppMenuProps> {
    render() {
        const { AppMenuAction, show, childs } = this.props

        const renderAppMenu = () => {
            return (
                <div className="appMenu" onClick={(event) => event.stopPropagation()}>
                    {childs[0]}
                    {childs[1]}
                </div>
            )
        }

        return (
            <div style={{ position: "relative" }}>
                <button className="appMenuButton" type="button" onClick={(event) => { event.stopPropagation(); AppMenuAction() }}>
                    <Icon path={mdiDotsVertical} size={"1em"} />
                </button>
                {show ? renderAppMenu() : undefined}
            </div>
        )
    }
}
