import React from "react"
import { assertUnreachable, formatDate } from "./utils"
import "@mdi/font/css/materialdesignicons.min.css"
import "./App.css"
import type { BackMessage, FrontMessage, UserList, ReceivedMessage, Toast } from "../../messages"

interface AppState {
    currentNick?: string,
    currentUserList?: UserList,
    messages: (ReceivedMessage | Toast)[],
}

class App extends React.Component {
    con?: WebSocket
    bell?: HTMLAudioElement
    bellReady = false

    state: AppState = {messages: []}

    textInputRef = React.createRef<HTMLTextAreaElement>()
    textFieldRef = React.createRef<HTMLDivElement>()
    nickInputRef = React.createRef<HTMLInputElement>()

    componentDidMount() {
        this.con = new WebSocket(`ws://${window.location.hostname}:8080`)
        this.con.onmessage = (event) => this.receive(event)

        this.bell = new Audio("assets/bell.oga")
        this.bell.addEventListener("canplaythrough", event => {
            this.bellReady = true;
        })

        Notification.requestPermission()
    }

    componentWillUnmount() {
        this.con?.close()
    }

    send(data: FrontMessage): void {
        this.con!.send(JSON.stringify(data))
    }

    receive(msgEvent: MessageEvent): void {
        const data: BackMessage = JSON.parse(msgEvent.data)
        if (data.type === "userList") {
           this.receiveUserList(data)
        } else if (data.type === "message") {
            this.receiveMessage(data)
        } else if (data.type === "toast") {
            this.receiveToast(data)
        } else {
            assertUnreachable()
        }
    }

    notification(data: ReceivedMessage): void {
        if ("Notification" in window && Notification.permission === "granted") {
            const options = {
                body: data.text,
                renotify: true,
                tag: "msg",
            }
            try {
                new Notification(`${data.from}`, options)
                return
            } catch (error) {
                if (!(error instanceof TypeError)) {
                    throw error
                }
            }
        }
        if (this.bell && this.bellReady) {
            this.bell.play()
        }
    }

    receiveUserList(data: UserList): void {
        if (!this.state.currentNick) {
            const yourUser = data.users.filter(x => x.own).map(x => x.name)[0]
            this.setState({ currentNick: yourUser })
        }
        this.setState({ currentUserList: data })
    }

    receiveMessage(data: ReceivedMessage): void {
        if (document.hidden) {
            this.notification(data)
        }
        this.setState({ messages: this.state.messages.concat([data]) })
    }

    receiveToast(data: Toast): void {
        if (data.toast === "nickChange" && data.own) {
            this.setState({ currentNick: data.newName })
        }
        this.setState({ messages: this.state.messages.concat([data]) })
    }

    sendMessage(): void {
        const textInput = this.textInputRef.current!
        const textField = this.textFieldRef.current!
        textField.scrollTop = textField.scrollHeight
        textInput.focus()
        const text = textInput.value.trim()
        if (text) {
            this.send({
                type: "message",
                text: text
            })
        }
        textInput.value = ""
        textInput.style.height = "auto"
    }

    render() {
        const { currentNick, currentUserList, messages } = this.state

        const onNickSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
            const nickInput = this.nickInputRef.current!
            const textInput = this.textInputRef.current!
            const text = nickInput.value.trim()
            if (text && text !== this.state.currentNick) {
                this.send({
                    type: "userName",
                    text: text
                })
            }
            nickInput.value = ""
            textInput.focus()
            event.preventDefault()
        }

        const nickField = (
            <form className="nickField" autoComplete="off" onSubmit={onNickSubmit}>
                <input ref={this.nickInputRef} type="text" className="nickInput" placeholder={currentNick || "Write your nick"} maxLength={20} />
                <button className="nickButton" type="submit">
                    <span className="mdi mdi-account-edit"></span>
                </button>
            </form>
        )

        const renderMsg = (data: ReceivedMessage, i: number) => {
            const msgDate = new Date(data.date)
            const doesMatch = (msg: ReceivedMessage | Toast) =>
                msg.type === "message" && data.from === msg.from
            const isFollowup = (i > 0 && doesMatch(messages[i-1]))
            let msgClass = "message"
            if (data.own) msgClass += " own"
            if (isFollowup) msgClass += " followup"
            return (
                <div className={msgClass}>
                    {(!data.own && !isFollowup) ? 
                        <span className="message-user" style={{color: data.cssColor}}>{data.from}</span> :
                        null}
                    <span className="message-text">{data.text}</span>
                    <span className="message-time">{formatDate(msgDate)}</span>
                </div>
            )
        }

        const renderToast = (data: Toast) => {
            let text: string
            if (data.toast === "userChange") {
                if (data.sign === "plus") {
                    text = data.own ? "You are now online" : `${data.name} has just arrived`
                } else if (data.sign === "minus") {
                    text = !data.own ? `${data.name} has left` : assertUnreachable()
                } else {
                    assertUnreachable()
                }
            } else if (data.toast === "nickChange") {
                text = data.own ?
                    `Your username is now: ${data.newName}` :
                    `User "${data.oldName}" is now "${data.newName}"`
            } else if (data.toast === "punish") {
                text = data.text
            } else {
                assertUnreachable()
            }
            return (
                <div className="toast">
                    <span className="toast-text">
                    {text}
                    </span>
                </div>
            )
        }

        const renderedMessages = messages.map((data, i) => {
            if (data.type === "message") return renderMsg(data, i)
            if (data.type === "toast") return renderToast(data)
        })
        const textField = (
            <div ref={this.textFieldRef} className="textField">
                {renderedMessages}
            </div>
        )
        
        const onTextInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
            const currentScroll = this.preAutoscroll()
            const borders = 2 // Border size (top +  bottom) in px. FIXME cause this is ugly
            event.currentTarget.style.height = "auto"
            event.currentTarget.style.height = (event.currentTarget.scrollHeight + borders) + "px";
            this.postAutoscroll(currentScroll)
        }

        const onTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                this.sendMessage()
            }
        }
        const onTextSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
            event.preventDefault()
            this.sendMessage()
        }
        const messageField = (
            <form className="messageField" autoComplete="off" onSubmit={onTextSubmit}>
                <textarea ref={this.textInputRef} className="textInput" placeholder="Type a message"
                    rows={1} autoFocus maxLength={5000} onInput={onTextInput}
                    onKeyDown={onTextKeyDown}></textarea>
                <button className="sendButton" type="submit">
                    <span className="mdi mdi-send"></span>
                </button>
            </form>
        )

        const topBarText = !currentUserList ? "Loading..." : ((data) => {
            const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
            otherUsers.push("You")
            return otherUsers.join(", ")
        })(currentUserList)

        return (
            <div className="container">
                <div className="app">
                    <div className="topBar">
                        <div className="topBarLine1">
                            <h2 className="topBarTitle">Chat-room</h2>
                            {nickField}
                        </div>
                        <p className="topBarText">{topBarText}</p>
                    </div>
                    {textField}
                    {messageField}
                </div>
            </div >
        )
    }

    preAutoscroll() {
        const textField = this.textFieldRef.current!
        const maxScroll = textField.scrollHeight - (textField.clientHeight)
        const currentScroll = maxScroll - textField.scrollTop
        return currentScroll
    }

    postAutoscroll(snapshot: number) {
        const textField = this.textFieldRef.current!
        const maxScroll = textField.scrollHeight - (textField.clientHeight)
        textField.scrollTop = maxScroll - snapshot
    }

    getSnapshotBeforeUpdate() {
        return this.preAutoscroll()
    }

    componentDidUpdate(prevProps: {}, prevState: AppState, snapshot: number) {
        this.postAutoscroll(snapshot)
    }
}

export default App
