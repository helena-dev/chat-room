import React from "react"
import { BackMessage, FrontMessage, LoginResponse } from "../../messages"
import "./App.css"
import ChatScreen from "./ChatScreen"
import LoginScreen from "./LoginScreen"
import { assertUnreachable } from "./utils"

export interface AppState {
    phase: "login" | "connected"
    failedLogin: boolean
}

export default class App extends React.Component {
    con?: WebSocket
    chatScreenRef = React.createRef<ChatScreen>()
    failedLoginTimeout: any

    state: AppState = { phase: "login", failedLogin: false }

    componentDidMount() {
        this.con = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!)
        this.con.onmessage = (event) => this.receive(event)
    }

    componentWillUnmount() {
        this.con?.close()
        this.cancelTimeout()
    }

    cancelTimeout() {
        if (this.failedLoginTimeout) {
            clearTimeout(this.failedLoginTimeout)
            this.failedLoginTimeout = undefined
        }
    }

    send(data: FrontMessage): void {
        this.con!.send(JSON.stringify(data))
    }

    receive(event: MessageEvent): void {
        const data: BackMessage = JSON.parse(event.data)
        const { phase } = this.state
        if (phase === "login") {
            if (data.type === "login") {
                this.receiveLoginRespone(data)
            }
        } else if (phase === "connected") {
            this.chatScreenRef.current?.receive(data)
        }
    }

    receiveLoginRespone(data: LoginResponse) {
        if (data.ok) {
            this.cancelTimeout()
            this.setState({ phase: "connected" })
        } else if (!data.ok) {
            this.cancelTimeout()
            this.setState({ failedLogin: true })
            this.failedLoginTimeout = setTimeout(() => {
                this.failedLoginTimeout = undefined
                this.setState({ failedLogin: false })
            }, 2000)
        }
    }

    render() {
        const { phase, failedLogin } = this.state

        const getLoginInfo = (userName: string, password: string) => {
            this.send({
                type: "login",
                userName,
                password,
            })
        }

        return (
            phase === "login" ?
                <LoginScreen getLoginInfo={getLoginInfo} failedLogin={failedLogin} /> :
                phase === "connected" ?
                <ChatScreen ref={this.chatScreenRef} onSendMessage={(data) => this.send(data)} /> :
                    assertUnreachable()
        )
    }
}
