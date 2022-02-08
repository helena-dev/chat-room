import React from "react"
import { BackMessage, FrontMessage, LoginResponse, SignupResponse } from "../../messages"
import "./App.css"
import ChatScreen from "./ChatScreen/ChatScreen"
import LoginScreen from "./Login_Signup/LoginScreen"
import SignupScreen from "./Login_Signup/SignupScreen"
import { assertUnreachable } from "./utils"

export interface AppState {
    phase: "login" | "connected"
    failed: boolean
    signup: boolean
    usedUsername: boolean
    failedCaptcha: boolean
}

export default class App extends React.Component {
    con?: WebSocket
    chatScreenRef = React.createRef<ChatScreen>()
    failedTimeout: any

    state: AppState = { phase: "login", failed: false, signup: false, usedUsername: false, failedCaptcha: false }

    componentDidMount() {
        this.newCon()
    }

    componentWillUnmount() {
        this.con?.close()
        this.cancelTimeout()
    }

    newCon() {
        this.con = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!)
        this.con.onmessage = (event) => this.receive(event)
    }

    cancelTimeout() {
        if (this.failedTimeout) {
            clearTimeout(this.failedTimeout)
            this.failedTimeout = undefined
        }
    }

    send(data: FrontMessage): void {
        this.con!.send(JSON.stringify(data))
    }

    receive(event: MessageEvent): void {
        const data: BackMessage = JSON.parse(event.data)
        const { phase } = this.state
        if (phase === "login") {
            this.receiveResponse(data as LoginResponse | SignupResponse)
        } else if (phase === "connected") {
            this.chatScreenRef.current?.receive(data)
        }
    }

    receiveResponse(data: LoginResponse | SignupResponse) {
        if (data.ok) {
            this.cancelTimeout()
            this.setState({ phase: "connected" })
        } else if (!data.ok) {
            if (data.type === "signup") {
                if (data.err === 1062) {
                    this.setState({ usedUsername: true })
                } else if (data.err === -3) {
                    this.setState({ failedCaptcha: true })
                }
            }
            this.cancelTimeout()
            this.setState({ failed: true })
            this.failedTimeout = setTimeout(() => {
                this.failedTimeout = undefined
                this.setState({ failed: false, usedUsername: false, failedCaptcha: false})
            }, 2000)
        }
    }

    render() {
        const { phase, failed, signup, usedUsername, failedCaptcha } = this.state

        const getLoginInfo = (userName: string, password: string) => {
            this.send({
                type: "login",
                userName,
                password,
            })
        }

        const getSignupInfo = (userName: string, password: string, captchaResponse: string) => {
            this.send({
                type: "signup",
                userName,
                password,
                captchaResponse,
            })
        }

        const goSignup = (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault()
            this.setState({ signup: true })
        }

        const logout = () => {
            this.con!.close()
            this.setState({ phase: "login" })
            this.newCon()
        }

        return (
            phase === "login" ?
                (!signup ?
                    <LoginScreen getLoginInfo={getLoginInfo} failedLogin={failed} goSignup={goSignup} /> :
                    <SignupScreen getSignupInfo={getSignupInfo} failedSignup={failed} usedUsername={usedUsername} failedCaptcha={failedCaptcha} />) :
                phase === "connected" ?
                    <ChatScreen ref={this.chatScreenRef} onSendMessage={(data) => this.send(data)} logout={logout}/> :
                    assertUnreachable()
        )
    }
}
