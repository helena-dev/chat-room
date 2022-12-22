import React from "react"
import { assertUnreachable, rgbToHex, hexToRgb } from "../utils"
import Icon from "@mdi/react"
import { mdiClose, mdiPaperclip, mdiSend } from "@mdi/js"
import "./ChatScreen.css"
import type { BackMessage, FrontMessage, UserList, ReceivedMessage, Toast, UserTyping, DeleteMessage, AckMessage, EditMessage, UpdateBkgColor, UpdatePassword, Connection, OwnConnections, BasicMessage } from "../../../messages"
import ToastComponent from "./Message/Toast"
import Message from "./Message/Message"
import ReplyMessageComponent from "./Message/ReplyMessage"
import ScrollButton from "./ScrollButton"
import BigImage from "./BigImage"
import SidePanel from "./SidePanel"
import AppMenu from "./AppMenu/AppMenu"
import EditField from "./EditField"
import MessageMenu from "./Message/MessageMenu"
import Settings from "./AppMenu/Settings"
import Logout from "./AppMenu/Logout"
import SettingsMenu from "./AppMenu/SettingsMenu"

interface ChatScreenState {
    currentNick?: string,
    yourId: number,
    currentUserList?: UserList,
    messages: (ReceivedMessage | Toast)[],
    pseudoMessages: ReceivedMessage[],
    typingUsers: Map<number, NodeJS.Timeout>,
    showPanel: boolean,
    windowWidth: number,
    menuData?: MenuData,
    replyMsg?: number,
    editMsg?: ReceivedMessage,
    image?: string,
    textFieldScroll: number,
    bigImage?: string,
    showAppMenu: boolean,
    currentColor: [number, number, number],
    settingsMenu: boolean,
    changedPwd: boolean,
    wrongPwd: boolean,
    deleteConfirmation: boolean
    ownCons: Connection[]
}

export interface ChatScreenProps {
    onSendMessage: (data: FrontMessage) => void
    logout: () => void
}

interface MenuData {
    position: {
        top: number,
        left?: number,
        right?: number,
    }
    message: ReceivedMessage,
}

class ChatScreen extends React.Component<ChatScreenProps> {
    bell?: HTMLAudioElement
    bellReady = false
    onFocus!: () => void
    onBlur!: () => void
    handleResize!: () => void
    goSend = true
    resizeObserver!: ResizeObserver
    pseudoId: number = -1
    allMessages: (ReceivedMessage | Toast)[] = []
    wrongPwdTimeout: any
    changedPwdTimeout: any

    state: ChatScreenState = { messages: [], typingUsers: new Map(), showPanel: false, windowWidth: window.innerWidth, textFieldScroll: 0, pseudoMessages: [], showAppMenu: false, currentColor: [13, 20, 24], settingsMenu: false, changedPwd: false, wrongPwd: false, deleteConfirmation: false, ownCons: [], yourId: -1 }

    textInputRef = React.createRef<HTMLTextAreaElement>()
    textFieldRef = React.createRef<HTMLDivElement>()
    nickInputRef = React.createRef<HTMLInputElement>()

    componentDidMount() {
        this.bell = new Audio("/bell.oga")
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

        this.textFieldRef.current!.style.backgroundSize = `auto ${window.screen.height * 0.75}px`
    }

    componentWillUnmount() {
        window.removeEventListener("focus", this.onFocus)
        window.removeEventListener("blur", this.onBlur)
        for (const [key, value] of this.state.typingUsers) {
            clearTimeout(value)
        }

        window.removeEventListener("resize", this.handleResize);

        this.resizeObserver.disconnect()
    }

    send(data: FrontMessage): void {
        this.props.onSendMessage(data)
    }

    receive(data: BackMessage): void {
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
        } else if (data.type === "ackMessage") {
            this.receiveAckMessage(data)
        } else if (data.type === "edit") {
            this.receiveEditMessage(data)
        } else if (data.type === "bkgColor") {
            this.receiveBkgColor(data)
        } else if (data.type === "password") {
            this.receivePwd(data)
        } else if (data.type === "deleteConfirmation") {
            this.receiveDeleteConfirmation()
        } else if (data.type === "ownCons") {
            this.receiveOwnCons(data)
        } else if (data.type === "messageList") {
            this.receiveMessageList(data.messages)
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
                new Notification(`${data.user_name}`, options)
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
            const { name, id } = data.users.find(x => x.own)!
            this.setState({ currentNick: name, yourId: id })
        }
        this.setState({ currentUserList: data })
    }

    receiveMessage(data: ReceivedMessage): void {
        if (document.hidden && !data.own) {
            this.notification(data)
        }
        this.setState({ messages: this.state.messages.concat([data]) })
        const newMap = new Map(this.state.typingUsers)
        if (newMap.has(data.from_id)) {
            clearTimeout(newMap.get(data.from_id)!)
            newMap.delete(data.from_id)
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
        if (data.msgNum === this.state.replyMsg) {
            this.setState({ replyMsg: undefined })
        }
        const beforeMessages = this.state.messages;
        const afterMessages = beforeMessages.filter(x => x.msgNum !== data.msgNum)
        this.setState({ messages: afterMessages })
    }

    receiveAckMessage(data: AckMessage) {
        const beforeMessages = this.state.pseudoMessages
        for (const msg of beforeMessages) {
            if (msg.type === "message" && msg.msgNum === data.pseudoId) {
                msg.date = data.date
                msg.cssColor = data.cssColor
                msg.msgNum = data.msgNum
                const afterMessages = beforeMessages.filter(x => x !== msg)
                this.setState({ pseudoMessages: afterMessages })
                this.setState({ messages: this.state.messages.concat([msg]) })
            }
        }
    }

    receiveEditMessage(data: EditMessage) {
        const messageList = this.state.messages
        const msgIndex = messageList.findIndex(message => message.msgNum === data.msgNum)
        const msg = messageList[msgIndex]
        if (msg.type === "message") {
            msg.text = data.text
            msg.edited = true
        }
        this.setState({ messages: messageList })
    }

    receiveBkgColor(data: UpdateBkgColor) {
        this.setState({ currentColor: hexToRgb(data.color) })
    }

    cancelTimeout(timeout: any) {
        if (timeout) {
            clearTimeout(timeout)
            timeout = undefined
        }
    }

    receivePwd(data: UpdatePassword) {
        if (data.ok) {
            this.cancelTimeout(this.changedPwdTimeout)
            this.setState({ changedPwd: true })
            this.changedPwdTimeout = setTimeout(() => {
                this.changedPwdTimeout = undefined
                this.setState({ changedPwd: false })
            }, 2000)
        } else {
            this.cancelTimeout(this.wrongPwdTimeout)
            this.setState({ wrongPwd: true })
            this.wrongPwdTimeout = setTimeout(() => {
                this.wrongPwdTimeout = undefined
                this.setState({ wrongPwd: false })
            }, 2000)
        }
    }

    receiveDeleteConfirmation() {
        this.setState({ deleteConfirmation: true })
    }

    receiveOwnCons(data: OwnConnections) {
        this.setState({ ownCons: data.connections })
    }

    mutateSQLMessage = (msg: BasicMessage): ReceivedMessage => ({
        ...msg, text: msg.text || "", type: "message", edited: Boolean(msg.edited),
        cssColor: `white`, own: this.state.yourId === msg.from_id
    })

    receiveMessageList(data: BasicMessage[]) {
        this.setState({ messages: data.map(x => this.mutateSQLMessage(x)) })
    }

    sendMessage(): void {
        const textInput = this.textInputRef.current!
        const textField = this.textFieldRef.current!
        textField.scrollTop = textField.scrollHeight - textField.clientHeight
        textInput.focus()
        const text = textInput.value.trim()
        if (text && this.state.editMsg) {
            if (text !== this.state.editMsg.text) {
                const msg = this.state.editMsg
                msg.text = text
                msg.edited = true
                this.send({
                    type: "edit",
                    msgNum: msg.msgNum,
                    text,
                })
            } else {
                textInput.value = ""
                textInput.style.height = "auto"
            }
            this.setState({ editMsg: undefined })
        } else if (text || this.state.image) {
            const pseudoMsg: ReceivedMessage = {
                type: "message",
                text: text,
                image: this.state.image,
                own: true,
                user_name: this.state.currentNick!,
                from_id: this.state.yourId,
                date: new Date(),
                cssColor: "hsl(0, 100%, 50%)",
                msgNum: this.pseudoId,
                replyNum: this.state.replyMsg,
                edited: false,
            }
            this.setState({ pseudoMessages: this.state.pseudoMessages.concat([pseudoMsg]) })
            this.send({
                type: "message",
                text: text,
                image: this.state.image,
                replyNum: this.state.replyMsg,
                pseudoId: this.pseudoId
            })
            this.pseudoId--
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

    focusWOKeyboard() {
        const textInput = this.textInputRef.current!
        textInput.readOnly = true
        textInput.focus()
        setTimeout(() => textInput.readOnly = false, 10)
    }

    render() {
        const { yourId, currentNick, currentUserList, messages, typingUsers, showPanel, windowWidth, menuData, replyMsg, image, textFieldScroll, bigImage, pseudoMessages, showAppMenu, currentColor, editMsg, settingsMenu, changedPwd, wrongPwd, deleteConfirmation, ownCons } = this.state

        const onNickSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
            const nickInput = this.nickInputRef.current!
            const text = nickInput.value.trim()
            if (text && text !== this.state.currentNick) {
                this.send({
                    type: "userName",
                    text: text
                })
            }
            nickInput.value = ""
            this.focusWOKeyboard()
            event.preventDefault()
        }

        const onDeleteButtonClick = (i: number, own: boolean) => {
            if (!own) return
            if (editMsg?.msgNum) {
                this.setState({ editMsg: undefined })
                this.setState({ editMsg: undefined })
                const textInput = this.textInputRef.current!
                textInput.value = ""
                textInput.style.height = "auto"
                this.focusWOKeyboard()
            }
            this.send({
                type: "deleteMsg",
                msgNum: i,
            })
        }

        const onReplyButtonClick = (data: ReceivedMessage) => {
            if (!editMsg) {
                this.setState({ replyMsg: data.msgNum })
                const textInput = this.textInputRef.current!
                textInput.focus()
            }
        }

        const onEditButtonClick = (data: ReceivedMessage) => {
            if (!replyMsg) {
                if (!data.own) return
                this.setState({ editMsg: data })
                const textInput = this.textInputRef.current!
                textInput.value = data.text
                textInput.focus()
            }
        }

        const disappearMsgMenu = () => {
            this.setState({ menuData: undefined })
        }

        const onMsgMenuButtonClick = (element: HTMLDivElement, data: ReceivedMessage) => {
            const msgButtonBottom = element.children.namedItem("msgMenuButton")!.getBoundingClientRect().bottom
            const msgButtonHeight = element.children.namedItem("msgMenuButton")!.clientHeight
            const bottom = window.innerHeight - msgButtonBottom
            const height = data.own ? 110 : 46 /* FIXME hardcoded message menu height*/
            const textField = this.textFieldRef.current!
            let top = element.offsetTop + msgButtonHeight - textField.scrollTop + 66 /*FIXME hardcoded topBar height */
            if (bottom < height) {
                top -= height + msgButtonHeight
            }
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

        const onMessageImageAction = (image?: string) => {
            this.setState({ bigImage: image })
        }

        const disappearBigImage = () => {
            this.setState({ bigImage: undefined })
        }

        const settingsDisappear = () => {
            this.setState({ settingsMenu: false })
        }

        const replyClick = (msgNum: number) => {
            const msg = document.getElementById(`${msgNum}`)!
            const container = msg.parentElement!
            const color = "rgba(5, 97, 98, 0.5)"
            container.style.backgroundColor = color
            setTimeout(() => { container.style.backgroundColor = "transparent" }, 1000)
            const textField = this.textFieldRef.current!
            const top = msg.offsetTop
            const margin = 10
            const scroll = top - margin
            textField.scrollTop = scroll

        }

        const renderMsg = (data: ReceivedMessage, i: number) => {
            const doesMatch = (msg: ReceivedMessage | Toast) =>
                msg.type === "message" && data.from_id === msg.from_id
            const isFollowup = (i > 0 && doesMatch(this.allMessages[i - 1]))
            const reply = this.allMessages.find(x => (x.msgNum === data.replyNum)) as ReceivedMessage | undefined
            return <Message
                data={data}
                key={i}
                followup={isFollowup}
                onMenu={(element) => onMsgMenuButtonClick(element, data)}
                reply={reply}
                windowWidth={windowWidth}
                onAction={() => onMessageImageAction(data.image)}
                showButton={menuData?.message.msgNum === data.msgNum}
                replyClick={replyClick}
            />
        }

        const renderedMessages = () => {
            const msgs = messages
            const allmsgs = msgs.concat(pseudoMessages)
            this.allMessages = allmsgs
            return this.allMessages.map((data, i) => {
                if (data.type === "message") return renderMsg(data, i)
                if (data.type === "toast") return <ToastComponent data={data} key={i} />
            })
        }

        const onScrollButtonClick = () => {
            const textField = this.textFieldRef.current!
            textField.scrollTop = textField.scrollHeight - textField.clientHeight
            this.focusWOKeyboard()
        }

        const textField = (
            <div ref={this.textFieldRef} className="textField" onScroll={() => this.recalculateScroll()} style={{ backgroundColor: "rgb(" + currentColor + ")" }}>
                {renderedMessages()}
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

        const onClearEdit = () => {
            this.setState({ editMsg: undefined })
            const textInput = this.textInputRef.current!
            textInput.value = ""
            textInput.style.height = "auto"
            textInput.focus()
        }

        const replyField = () => {
            const reply = this.allMessages.find(x => (x.msgNum === replyMsg)) as ReceivedMessage | undefined
            return (
                <div className={"replyField"}>
                    <ReplyMessageComponent data={reply!} />
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
            if (img.size > 30 * 2 ** 20) {
                window.alert("The maximum file size is 30 MiB")
            } else {
                reader.readAsDataURL(img)
            }
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
                    {!editMsg ?
                        <input className="attachButton" type="file" accept="image/*" onInput={onImageInput} /> :
                        undefined}
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
                {editMsg ? <EditField data={editMsg} onAction={onClearEdit} /> : undefined}
                {replyMsg ? replyField() : undefined}
                {image ? imagePreview() : undefined}
                {messageBodyField}
            </div>
        )

        const topBarText = !currentUserList ? "Loading..." : ((userList, typingList) => {
            const connectedUsers = userList.users.filter(user => user.connected)
            const funcMap = new Map(typingList)
            if (funcMap.has(yourId)) funcMap.delete(yourId)
            const typingNum = funcMap.size
            if (!typingNum) {
                const userNum = connectedUsers.length
                const onlineUsersNum = connectedUsers.filter(x => x.online).length
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

        const onTopBarLeftClick = () => {
            this.setState({ showPanel: (showPanel ? false : true) })
        }

        const openAppMenu = () => {
            if (showAppMenu) this.setState({ showAppMenu: false })
            if (!showAppMenu) this.setState({ showAppMenu: true })
        }

        const disappearAppMenu = () => {
            this.setState({ showAppMenu: false })
        }

        const onColorSubmit = (event: React.FormEvent<HTMLFormElement>, [red, green, blue]: [React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>, React.RefObject<HTMLInputElement>]) => {
            const colors = [red.current!, green.current!, blue.current!]
            const rgb = colors.map(x => x.value ? parseInt(x.value) : parseInt(x.placeholder))
            if (rgb) {
                this.setState({ currentColor: rgb })
                this.send({
                    type: "bkgColor",
                    color: rgbToHex(rgb)
                })
            }
            for (const color of colors) {
                color.value = ""
            }
            this.focusWOKeyboard()
            event.preventDefault()
        }

        const onSettingsClick = () => {
            disappearAppMenu()
            this.setState({ settingsMenu: true })
        }

        const onLogoutClick = () => {
            this.props.logout()
        }

        const topBar = (
            <div className="topBar">
                <div className="topBarLeft" onClick={onTopBarLeftClick}>
                    <h2 className="topBarTitle">Chat-room</h2>
                    <p className="topBarText">{topBarText}</p>
                </div>
                <div className="topBarRight">
                    <AppMenu AppMenuAction={openAppMenu} show={showAppMenu} >
                        <Settings onSettingsClick={onSettingsClick} />
                        <Logout onLogoutClick={onLogoutClick} />
                    </AppMenu>
                </div>
            </div>
        )

        const changePassword = (oldPassword: string, password: string) => {
            this.send({
                type: "password",
                oldPwd: oldPassword,
                newPwd: password,
            })
        }

        const onDeleteAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const password = data.get("deleteAccountPassword") as string
            this.send({
                type: "deleteAccount",
                password,
            })
        }

        const deleteConfirmationHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
            const answer = event.currentTarget.innerText
            if (answer === "Yes") {
                this.send({
                    type: "deleteAccountYes"
                })
                this.props.logout()
            } else if (answer === "No") {
                this.setState({ deleteConfirmation: false })
            } else {
                assertUnreachable()
            }
        }

        return (
            <div className="container">
                {settingsMenu ? <SettingsMenu settingsDisappear={settingsDisappear}
                    currentNick={currentNick} onNickSubmit={onNickSubmit} reference={this.nickInputRef}
                    onColorSubmit={onColorSubmit} currentColor={currentColor}
                    changePassword={changePassword} changedPwd={changedPwd} wrongPwd={wrongPwd}
                    onDeleteAccountSubmit={onDeleteAccountSubmit} deleteConfirmation={deleteConfirmation}
                    deleteConfirmationHandler={deleteConfirmationHandler} connections={ownCons} /> : undefined}
                {bigImage ? <BigImage image={bigImage} onAction={disappearBigImage} /> : undefined}
                {showPanel ? <SidePanel windowWidth={windowWidth} currentUserList={currentUserList} typingUsers={typingUsers} /> : undefined}
                <div className="app" onClick={disappearAppMenu}>
                    {topBar}
                    {textField}
                    {menuData ?
                        <MessageMenu
                            menuData={menuData}
                            onDelete={onDeleteButtonClick}
                            onReply={onReplyButtonClick}
                            onEdit={onEditButtonClick}
                            disappear={disappearMsgMenu}
                        /> :
                        undefined}
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

    componentDidUpdate(prevProps: {}, prevState: ChatScreenState, snapshot: number) {
        this.postAutoscroll(snapshot)
    }
}

export default ChatScreen
