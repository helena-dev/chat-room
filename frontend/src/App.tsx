import React from "react"
import { assertUnreachable } from "./utils"
import Icon from "@mdi/react"
import { mdiAccountEdit, mdiClose, mdiSend, mdiPaperclip, mdiSignatureImage } from "@mdi/js"
import "./App.css"
import type { BackMessage, FrontMessage, UserList, ReceivedMessage, Toast, UserTyping, DeleteMessage } from "../../messages"
import UserCard from "./UserCard"
import ToastComponent from "./Toast"
import Message from "./Message"
import ReplyMessageComponent from "./ReplyMessage"
import ScrollButton from "./ScrollButton"
import BigImage from "./BigImage"

interface AppState {
    currentNick?: string,
    currentUserList?: UserList,
    messages: (ReceivedMessage | Toast)[],
    messagesNums: number[],
    typingUsers: Map<string, NodeJS.Timeout>,
    showPanel: boolean,
    windowWidth: number,
    menuData?: MenuData,
    replyMsg?: ReceivedMessage
    image?: string
    textFieldScroll: number
    bigImage?: string
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
    resizeObserver!: ResizeObserver

    state: AppState = { messages: [], typingUsers: new Map(), showPanel: false, windowWidth: window.innerWidth, textFieldScroll: 0, messagesNums: [] }

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

        this.resizeObserver = new ResizeObserver(() => { this.recalculateScroll() })
        this.resizeObserver.observe(this.textFieldRef.current!)
        this.recalculateScroll()
    }

    componentWillUnmount() {
        this.con?.close()
        window.removeEventListener("focus", this.onFocus)
        window.removeEventListener("blur", this.onBlur)
        for (const [key, value] of this.state.typingUsers) {
            clearTimeout(value)
        }

        window.removeEventListener("resize", this.handleResize);

        this.resizeObserver.disconnect()
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
        const nums = this.state.messagesNums
        nums.push(data.msgNum)
        this.setState({ messages: this.state.messages.concat([data]), messagesNums: nums })
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
        const beforeNums = this.state.messagesNums
        const afterNums = beforeNums.filter(x => x !== data.msgNum)
        this.setState({ messages: afterMessages, messagesNums: afterNums })
    }

    sendMessage(): void {
        const textInput = this.textInputRef.current!
        const textField = this.textFieldRef.current!
        textField.scrollTop = textField.scrollHeight - textField.clientHeight
        textInput.focus()
        const text = textInput.value.trim()
        if (text || this.state.image) {
            this.send({
                type: "message",
                text: text,
                image: this.state.image,
                reply: this.state.replyMsg,
            })
        }
        textInput.value = ""
        textInput.style.height = "auto"
        this.setState({ replyMsg: undefined, image: undefined })
    }

    recalculateScroll(): void {
        const textField = this.textFieldRef.current!
        const scroll = textField.scrollHeight - textField.scrollTop - textField.clientHeight
        this.setState({ textFieldScroll: scroll })
    }

    render() {
        const { currentNick, currentUserList, messages, typingUsers, showPanel, windowWidth, menuData, replyMsg, image, textFieldScroll, bigImage, messagesNums } = this.state

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

        const onReplyButtonClick = (data: ReceivedMessage) => {
            this.setState({ replyMsg: data })
            const textInput = this.textInputRef.current!
            textInput.focus()
        }

        const disappearMsgMenu = () => {
            this.setState({ menuData: undefined })
        }

        const onMsgMenuButtonClick = (element: HTMLDivElement, data: ReceivedMessage) => {
            const textField = this.textFieldRef.current!
            const top = element.offsetTop + 25 - textField.scrollTop
            const position = data.own ?
                { top, right: 15 + 15 } :
                { top, left: element.offsetWidth }
            this.setState({
                menuData: {
                    position,
                    message: data,
                }
            })
        }

        const messageMenu = ({ message: data, position }: MenuData) => {
            const delButton = (
                <button className="actionMsgButton" type="button" onClick={() => onDeleteButtonClick(data.msgNum, data.own)}>
                    Delete
                </button>
            )
            const replyButton = (
                <button className="actionMsgButton" type="button" onClick={() => onReplyButtonClick(data)}>
                    Reply
                </button>
            )
            return (
                <div className="messageMenuBkg" onClick={disappearMsgMenu}>
                    <div className="messageMenu" style={position}>
                        {replyButton}
                        {data.own ? delButton : undefined}
                    </div>
                </div>
            )
        }

        const onMessageImageAction = (image?: string) => {
            this.setState({ bigImage: image })
        }

        const disappearBigImage = () => {
            this.setState({ bigImage: undefined })
        }

        const renderMsg = (data: ReceivedMessage, i: number) => {
            const doesMatch = (msg: ReceivedMessage | Toast) =>
                msg.type === "message" && data.from === msg.from
            const isFollowup = (i > 0 && doesMatch(messages[i - 1]))
            return <Message data={data} key={i} followup={isFollowup} onMenu={(element) => onMsgMenuButtonClick(element, data)} reply={data.reply} windowWidth={windowWidth} onAction={() => onMessageImageAction(data.image)} nums={messagesNums}/>
        }

        const renderedMessages = messages.map((data, i) => {
            if (data.type === "message") return renderMsg(data, i)
            if (data.type === "toast") return <ToastComponent data={data} key={i} />
        })

        const onScrollButtonClick = () => {
            const textInput = this.textInputRef.current!
            const textField = this.textFieldRef.current!
            textField.scrollTop = textField.scrollHeight - textField.clientHeight
            textInput.focus()
        }

        const textField = (
            <div ref={this.textFieldRef} className="textField" onScroll={() => this.recalculateScroll()}>
                {renderedMessages}
                <ScrollButton onAction={onScrollButtonClick} scroll={textFieldScroll} />
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

        const onClearReply = () => {
            this.setState({ replyMsg: undefined })
            const textInput = this.textInputRef.current!
            textInput.focus()
        }

        const replyField = () => {
            return (
                <div className={"replyField"}>
                    <ReplyMessageComponent data={replyMsg!} />
                    <button className="closeReplyButton" type="button" onClick={onClearReply}>
                        <Icon path={mdiClose} size={"1em"} />
                    </button>
                </div>
            )
        }

        const onImageInput = (event: React.FormEvent<HTMLInputElement>) => {
            const img = event.currentTarget.files![0]
            event.currentTarget.value = ""
            const reader = new FileReader()
            reader.readAsDataURL(img)
            reader.onerror = () => this.setState({ image: undefined })
            reader.onload = () => {
                const imgURL = reader.result as string
                if (imgURL.startsWith("data:image")) {
                    this.setState({ image: imgURL })
                }
            }
            this.textInputRef.current!.focus()
        }

        const onClearImage = () => {
            this.setState({ image: undefined })
            const textInput = this.textInputRef.current!
            textInput.focus()
        }

        const imagePreview = () => {
            return (
                <div className="messageField-image-container">
                    <img src={image!} className="messageField-image" decoding="async"></img>
                    <button className="closeImagePreviewButton" type="button" onClick={onClearImage}>
                        <Icon path={mdiClose} size={"1em"} />
                    </button>
                </div>
            )
        }

        const messageBodyField = (
            <form className="messageBodyField" autoComplete="off" onSubmit={onTextSubmit}>
                <label className="attachLabel">
                    <Icon path={mdiPaperclip} size={"1em"} />
                    <input className="attachButton" type="file" accept="image/*" onInput={onImageInput} />
                </label>
                <textarea ref={this.textInputRef} className="textInput" placeholder="Type a message"
                    rows={1} autoFocus maxLength={5000} onInput={(event) => { onTextInput(event); isTyping() }}
                    onKeyDown={onTextKeyDown}></textarea>
                <button className="sendButton" type="submit">
                    <Icon path={mdiSend} size={"1em"} />
                </button>
            </form>
        )

        const messageField = (
            <div>
                {replyMsg ? replyField() : undefined}
                {image ? imagePreview() : undefined}
                {messageBodyField}
            </div>
        )

        const topBarText = !currentUserList ? "Loading..." : ((userList, typingList) => {
            const funcMap = new Map(typingList)
            if (funcMap.has(currentNick!)) funcMap.delete(currentNick!)
            const typingNum = funcMap.size
            if (!typingNum) {
                const userNum = userList.users.length
                const onlineUsersNum = userList.users.filter(x => x.online).length
                const membership = userNum === 1 ? " member" : " members"
                return userNum + membership + (onlineUsersNum > 1 ? ", " + onlineUsersNum + " online" : "")
            } else {
                if (typingNum < 3) {
                    const typing = typingNum === 1 ? " is " : " are "
                    return Array.from(funcMap.keys()).join(", ") + typing + "typing..."
                } else {
                    return typingNum + " users are typing..."
                }
            }
        })(currentUserList, typingUsers)

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
                {bigImage ? <BigImage image={bigImage} onAction={disappearBigImage}/> : undefined}
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
