import React from "react"
import { assertUnreachable } from "./utils"
import Icon from "@mdi/react"
import { mdiAccountEdit, mdiSend } from "@mdi/js"
import "./App.css"
import type { BackMessage, FrontMessage, UserList, ReceivedMessage, Toast, UserTyping, DeleteMessage } from "../../messages"
import UserCard from "./UserCard"
import ToastComponent from "./Toast"
import Message from "./Message"

interface AppState {
    currentNick?: string,
    currentUserList?: UserList,
    messages: (ReceivedMessage | Toast)[],
    typingUsers: Map<string, NodeJS.Timeout>,
    showPanel: boolean,
    windowWidth: number,
    menuData?: MenuData,
}

interface MenuData {
    position: {
        top: number,
        left?: number,
        right?: number,
    }
    message: ReceivedMessage,
}

class App extends React.Component {
    con?: WebSocket
    bell?: HTMLAudioElement
    bellReady = false
    onFocus!: () => void
    onBlur!: () => void
    handleResize!: () => void
    goSend = true

    state: AppState = { messages: [], typingUsers: new Map(), showPanel: false, windowWidth: window.innerWidth, }

    textInputRef = React.createRef<HTMLTextAreaElement>()
    textFieldRef = React.createRef<HTMLDivElement>()
    nickInputRef = React.createRef<HTMLInputElement>()

    componentDidMount() {
        this.con = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!)
        this.con.onmessage = (event) => this.receive(event)

        this.bell = new Audio("assets/bell.oga")
        this.bell.addEventListener("canplaythrough", event => {
            this.bellReady = true;
        })
        this.onFocus = () => {
            this.send({
                type: "isOnline",
                online: true,
            })
        }
        this.onBlur = () => {
            this.send({
                type: "isOnline",
                online: false,
            })
        }

        Notification.requestPermission()
        window.addEventListener("focus", this.onFocus)
        window.addEventListener("blur", this.onBlur)

        this.handleResize = () => {
            this.setState({ windowWidth: window.innerWidth })
        }

        window.addEventListener("resize", this.handleResize);
    }

    componentWillUnmount() {
        this.con?.close()
        window.removeEventListener("focus", this.onFocus)
        window.removeEventListener("blur", this.onBlur)
        for (const [key, value] of this.state.typingUsers) {
            clearTimeout(value)
        }

        window.removeEventListener("resize", this.handleResize);
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
        } else if (data.type === "typing") {
            this.receiveTyping(data)
        } else if (data.type === "deleteMsg") {
            this.receiveDeleteMsg(data)
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
        const newMap = new Map(this.state.typingUsers)
        if (newMap.has(data.from)) {
            clearTimeout(newMap.get(data.from)!)
            newMap.delete(data.from)
            this.setState({ typingUsers: newMap })
        }
    }

    receiveToast(data: Toast): void {
        if (data.toast === "nickChange" && data.own) {
            this.setState({ currentNick: data.newName })
        }
        this.setState({ messages: this.state.messages.concat([data]) })
    }

    receiveTyping(data: UserTyping): void {
        const newMap = new Map(this.state.typingUsers)
        if (newMap.has(data.from)) clearTimeout(newMap.get(data.from)!)
        const timeout = setTimeout(() => {
            const newMap = new Map(this.state.typingUsers)
            newMap.delete(data.from)
            this.setState({ typingUsers: newMap })
        }, 2000)
        newMap.set(data.from, timeout)
        this.setState({ typingUsers: newMap })
    }

    receiveDeleteMsg(data: DeleteMessage) {
        const beforeMessages = this.state.messages;
        const afterMessages = beforeMessages.filter(x => x.msgNum !== data.msgNum)
        this.setState({ messages: afterMessages })
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
        const { currentNick, currentUserList, messages, typingUsers, showPanel, windowWidth, menuData } = this.state

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
                    <Icon path={mdiAccountEdit} size={"1em"} />
                </button>
            </form>
        )

        const onDeleteButtonClick = (i: number, own: boolean) => {
            if (!own) return
            this.send({
                type: "deleteMsg",
                msgNum: i,
            })
        }

        const disappearMsgMenu = () => {
            this.setState({ menuData: undefined })
        }

        const onMsgMenuButtonClick = (element: HTMLDivElement, data: ReceivedMessage) => {
            const top = element.offsetTop + 25
            const position = data.own ?
                { top, right: 15 + 15 } :
                { top, left: element.offsetWidth }
            this.setState({ menuData: {
                position,
                message: data,
            } })
        }

        const messageMenu = ({ message: data, position }: MenuData) => {
            const delButton = (
                <button className="deleteMsgButton" type="button" onClick={() => onDeleteButtonClick(data.msgNum, data.own)}>
                    Delete
                </button>
            )
            return (
                <div className="messageMenuBkg" onClick={disappearMsgMenu}>
                    <div className="messageMenu" style={position}>
                        {data.own ? delButton : undefined}
                    </div>
                </div>
            )
        }

        const renderMsg = (data: ReceivedMessage, i: number) => {
            const doesMatch = (msg: ReceivedMessage | Toast) =>
                msg.type === "message" && data.from === msg.from
            const isFollowup = (i > 0 && doesMatch(messages[i - 1]))
            return <Message data={data} key={i} followup={isFollowup} onMenu={(element) => onMsgMenuButtonClick(element, data)} />
        }

        const renderedMessages = messages.map((data, i) => {
            if (data.type === "message") return renderMsg(data, i)
            if (data.type === "toast") return <ToastComponent data={data} key={i} />
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

        const isTyping = () => {
            if (!this.goSend) return
            this.send({
                type: "typing",
            })
            this.goSend = false
            setTimeout(() => {
                this.goSend = true
            }, 1000)
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
                    rows={1} autoFocus maxLength={5000} onInput={(event) => { onTextInput(event); isTyping() }}
                    onKeyDown={onTextKeyDown}></textarea>
                <button className="sendButton" type="submit">
                    <Icon path={mdiSend} size={"1em"} />
                </button>
            </form>
        )

        const topBarText = !currentUserList ? "Loading..." : ((data) => {
            const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
            otherUsers.push("You")
            return otherUsers.join(", ")
        })(currentUserList)

        const sidePanel = () => {
            const size = windowWidth >= 1170 ? " wide" : " narrow"
            const sortUsers = Array.from(currentUserList?.users || [])
            const cards = sortUsers.sort((a, b) => a.own ? -1 : 0).map(user =>
                <UserCard user={user} typingStatus={typingUsers.has(user.name)} key={user.name} />)
            return (
                <div className={"sidePanelContainer" + size}>
                    <div className={"sidePanel" + size}>
                        <header className={"upperSidePanel" + size}>
                            Users
                        </header>
                        <div className={"lowerSidePanel" + size}>
                            {cards}
                        </div>
                    </div>
                </div>
            )
        }

        const onTopBarLeftClick = () => {
            this.setState({ showPanel: (showPanel ? false : true) })
        }

        return (
            <div className="container">
                {showPanel ? sidePanel() : undefined}
                <div className="app">
                    <div className="topBar">
                        <div className="topBarLeft" onClick={onTopBarLeftClick}>
                            <h2 className="topBarTitle">Chat-room</h2>
                            <p className="topBarText">{topBarText}</p>
                        </div>
                        <div className="topBarRight">
                            {nickField}
                        </div>
                    </div>
                    {textField}
                    {menuData ? messageMenu(menuData) : undefined}
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
