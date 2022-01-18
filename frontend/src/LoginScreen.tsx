import React from "react"
import "./LoginScreen.css"
import Icon from "@mdi/react"
import { mdiLogin, mdiAccountEdit, mdiFormTextboxPassword } from '@mdi/js';

export interface LoginScreenProps {
    getLoginInfo: (userName: string, password: string) => void
    failedLogin: boolean
    goSignup: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

export default class LoginScreen extends React.Component<LoginScreenProps> {
    render() {
        const { getLoginInfo, failedLogin, goSignup } = this.props

        const onLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const userName = data.get("userName") as string
            const password = data.get("password") as string
            getLoginInfo(userName, password)
        }
        const visibility = failedLogin ? "visible" : "hidden"
        return (
            <div className="loginBiggestContainer">
                <div className="loginContainer">
                    <h2 className="loginTitle">Chat-room</h2>
                    <form className="loginForm" onSubmit={onLoginSubmit}>
                        <div className="loginInputContainer">
                            <label className="loginInputLabel">
                                <Icon path={mdiAccountEdit} size={"1em"} />
                                <input className="loginInput" type="text" name="userName" required maxLength={20} placeholder="Username" />
                            </label>
                        </div>
                        <div className="loginInputContainer">
                            <label className="loginInputLabel">
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                                <input className="loginInput" type="password" name="password" required maxLength={64} placeholder="Password" />
                            </label>
                        </div>
                        <button type="submit" className="loginButton">
                            <Icon path={mdiLogin} size={"1em"} />
                            Log-in
                        </button>
                    </form>
                    <div className="signupRedirect">
                        <span>Don't have an account? </span>
                        <a className="signupRedirectButton" href="#" onClick={goSignup}>
                            Sign-up
                        </a>
                    </div>
                    <div className="loginError" style={{ visibility }}>
                        <span className="loginErrorMsg">
                            There was a problem with the Login.
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
