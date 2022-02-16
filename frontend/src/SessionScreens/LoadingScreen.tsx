import "./LoadingScreen.css"
import Icon from "@mdi/react"
import { mdiLoading } from '@mdi/js';

export default function LoadingScreen() {
    return (
        <div className="loadingContainer">
            <div className="loadingSpinner">
                <Icon path={mdiLoading} size={"1em"} />
            </div>
            <span className="loadingText">Loading...</span>
        </div>
    )
}
