import { useState } from 'react'
import "./OwnConsList.css"
import Icon from "@mdi/react"
import { mdiChevronRight } from '@mdi/js';
import { Connection } from '../../../../messages';
import OwnCons from './OwnCons';

export interface OwnConsListProps {
    connections: Connection[]
}

export default function OwnConsList({ connections }: OwnConsListProps) {
    const [showCons, setShowCons] = useState(false)

    const onOwnConsClick = () => {
        setShowCons(!showCons)
    }

    const cards = connections.map(connection =>
        <OwnCons connection={connection} key={connection.conNum} />)
    return (
        <div className="ownConsListContainer">
            <button className="ownConsListButton" type="button" onClick={onOwnConsClick}>
                <div className={showCons ? "ownConsListIcon down" : "ownConsListIcon"}>
                    <Icon path={mdiChevronRight} size={"1em"} />
                </div>
                <h3 className="ownConsListTitle">Active Sessions</h3>
            </button>
            {showCons ? cards : undefined}
        </div>
    )
}
