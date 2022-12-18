import React from "react"
import { BackMessage, FrontMessage, LoginResponse, SignupResponse, TokenAuthResponse } from "../../messages"
import "./App.css"
import ChatScreen from "./ChatScreen/ChatScreen"
import ErrorScreen, { ErrorReason } from "./SessionScreens/ErrorScreen"
import LoadingScreen from "./SessionScreens/LoadingScreen"
import LoginScreen from "./SessionScreens/LoginScreen"
import SignupScreen from "./SessionScreens/SignupScreen"
import { assertUnreachable } from "./utils"

export interface AppState {
    phase: "error" | "loading" | "login" | "connected"
    failed: boolean
    signup: boolean
    usedUsername: boolean
    failedCaptcha: boolean
    errorReason?: ErrorReason
}

export default class App extends React.Component<{}, AppState> {
    con?: WebSocket
    chatScreenRef = React.createRef<ChatScreen>()
    failedTimeout: any

    state: AppState = { phase: "loading", failed: false, signup: false, usedUsername: false, failedCaptcha: false }

    componentDidMount() {
        this.newCon()
    }

    componentWillUnmount() {
        this.closeCon()
        this.cancelTimeout()
    }

    closeCon() {
        if (this.con) {
            this.con.onclose = null
            this.con.close()
            this.con = undefined
        }
    }

    newCon() {
        this.closeCon()
        this.con = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!)
        this.setState({ phase: "loading" })
        this.con.onopen = () => {
            const token = localStorage.getItem('token')
            if (token) {
                this.send({
                    type: "auth",
                    token: token,
                })
            } else this.setState({ phase: "login" })
        }
        this.con.onclose = () => {
            const errorReason = this.state.phase === "loading" ? "connectionFailed" : "disconnected"
            this.setState({ phase: "error", errorReason })
        }
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
        if (phase === "loading") {
            this.recieveAuth(data as TokenAuthResponse)
        } else if (phase === "login") {
            this.receiveResponse(data as LoginResponse | SignupResponse)
        } else if (phase === "connected") {
            this.chatScreenRef.current?.receive(data)
        }
    }

    recieveAuth(data: TokenAuthResponse) {
        if (data.ok) {
            this.cancelTimeout()
            this.setState({ phase: "connected" })
        } else {
            this.setState({ phase: "login" })
        }
    }

    receiveResponse(data: LoginResponse | SignupResponse) {
        if (data.ok) {
            this.cancelTimeout()
            this.setState({ phase: "connected" })
            data.token && localStorage.setItem('token', data.token);
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
                this.setState({ failed: false, usedUsername: false, failedCaptcha: false })
            }, 2000)
        }
    }

    render() {
        const { phase, failed, signup, usedUsername, failedCaptcha, errorReason } = this.state

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
            localStorage.removeItem("token")
            this.newCon()
        }

        const onReconnect = () => {
            this.newCon()
        }

        return (
            phase === "error" ?
                <ErrorScreen onReconnect={onReconnect} reason={errorReason} /> :
                phase === "loading" ?
                    <LoadingScreen /> :
                    phase === "login" ?
                        (!signup ?
                            <LoginScreen getLoginInfo={getLoginInfo} failedLogin={failed} goSignup={goSignup} /> :
                            <SignupScreen getSignupInfo={getSignupInfo} failedSignup={failed} usedUsername={usedUsername} failedCaptcha={failedCaptcha} />) :
                        phase === "connected" ?
                            <ChatScreen ref={this.chatScreenRef} onSendMessage={(data) => this.send(data)} logout={logout} /> :
                            assertUnreachable()
        )
    }
}
