import { Component, createRef, FormEvent, KeyboardEvent } from "react"
import { formatDate } from "./utils"
import "@mdi/font/css/materialdesignicons.min.css"
import "./App.css"
import type { BackMessage, FrontMessage, ReceivedMessage, Toast } from "../../messages"

class App extends Component {
    con?: WebSocket
    lastMsgSender?: string
    firstUsrLst = true
    bell?: HTMLAudioElement
    bellReady = false

    textInputRef = createRef<HTMLTextAreaElement>()
    textFieldRef = createRef<HTMLDivElement>()

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
            if (this.firstUsrLst) {
                const yourUser = data.users.filter(x => x.own).map(x => x.name)[0]
                //nickInput.placeholder = yourUser  FIXME
                this.firstUsrLst = false
            }
            // const topBarText: HTMLParagraphElement = document.querySelector("#topBarText")!
            // const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
            // otherUsers.push("You")
            // topBarText.innerText = otherUsers.join(", ")
        } else if (data.type === "message") {
            if (document.hidden) {
                this.notification(data)
            }
            this.receiveMessage(data)
        } else if (data.type === "toast") {
            this.receiveToast(data)
        } else {
            throw Error("owo")
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

    receiveMessage(data: ReceivedMessage): void {
        console.log("he rebut mogudes", data)
    }

    receiveToast(data: Toast): void {
        console.log("he rebut mogudes", data)
    }

    sendMessage(): void {
        const textInput = this.textInputRef.current!
        const textField = this.textFieldRef.current!
        textField.scrollTop = textField.scrollHeight
        textInput.focus()
        const text = textInput.value.trim()
        console.log("mèu", text)
        if (text) {
            this.send({
                type: "message",
                text: text
            })
        }
        textInput.value = ""
        textInput.style.height = "auto"
    }

    autoscroll(childNode?: HTMLElement): void {
        const textField = this.textFieldRef.current!
        const currentScroll = textField.scrollTop + textField.clientHeight
        const currentHeight = textField.scrollHeight
        if (childNode) {
            textField.appendChild(childNode)
        }
        if (currentScroll >= currentHeight - 20) {
            textField.scrollTop = textField.scrollHeight
        }
    }

    render() {
        const nickField = (
            <form className="nickField" autoComplete="off">
                <input type="text" className="nickInput" placeholder="Write your nick" maxLength={20} />
                <button className="nickButton" type="submit">
                    <span className="mdi mdi-account-edit"></span>
                </button>
            </form>
        )

        const textField = (
            <div ref={this.textFieldRef} className="textField">
            </div>
        )
        
        const onTextInput = (event: FormEvent<HTMLTextAreaElement>) => {
            event.currentTarget.style.height = "auto"
            event.currentTarget.style.height = (event.currentTarget.scrollHeight) + "px";
            this.autoscroll()
        }
        const onTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                this.sendMessage()
            }
        }
        const onTextSubmit = (event: FormEvent<HTMLFormElement>): void => {
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

        return (
            <div className="container">
                <div className="app">
                    <div className="topBar">
                        <div className="topBarLine1">
                            <h2 className="topBarTitle">Chat-room</h2>
                            {nickField}
                        </div>
                        <p className="topBarText">Loading...</p>
                    </div>
                    {textField}
                    {messageField}
                </div>
            </div >
        )
    }
}

export default App