import React from "react"
import "./BigImage.css"

export interface BigImageProps {
    image: string
    onAction: () => void
}

export default class BigImage extends React.Component<BigImageProps> {
    render() {
        const { image, onAction } = this.props
        return (
            <div className="bigImageBkg" onClick={onAction}>
                <div className="bigImage">
                    <img src={image} decoding="async"></img>
                </div>
            </div>
        )
    }
}
