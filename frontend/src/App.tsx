import { Component } from "react"
import { formatDate } from "./utils"
import "@mdi/font/css/materialdesignicons.min.css"
import "./App.css"
import type { BackMessage, FrontMessage, RecievedMessage, Toast } from "../../messages"

class App extends Component {
    render() {
        return (
            <div className="container">
                <div className="app">
                    <div className="topBar">
                        <div className="topBarLine1">
                            <h2 className="topBarTitle">Chat-room</h2>
                            <form className="nickField" autoComplete="off">
                                <input type="text" className="nickInput" placeholder="Write your nick" maxLength={20} />
                                <button className="nickButton" type="submit">
                                    <span className="mdi mdi-account-edit"></span>
                                </button>
                            </form>
                        </div>
                        <p className="topBarText">Loading...</p>
                    </div>
                    <div className="textField">
                    </div>
                    <form className="messageField" autoComplete="off">
                        <textarea className="textInput" placeholder="Type a message" rows={1} autoFocus maxLength={5000}></textarea>
                        <button className="sendButton" type="submit">
                            <span className="mdi mdi-send"></span>
                        </button>
                    </form>
                </div>
            </div >
        )
    }
}

export default App