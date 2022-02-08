import React from "react"
import Icon from "@mdi/react"
import { mdiDelete, mdiFormTextboxPassword } from '@mdi/js';
import "./DeleteAccount.css"

export interface DeleteAccountProps {
    onDeleteAccountSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    deleteConfirmation: boolean
    deleteConfirmationHandler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export default class DeleteAccount extends React.Component<DeleteAccountProps> {
    render() {
        const { onDeleteAccountSubmit, deleteConfirmation, deleteConfirmationHandler } = this.props

        return (
            <div className="deleteContainer">
                <h3 className="deleteTitle">Delete Account</h3>
                {deleteConfirmation ?
                    <div className="deleteConfirmation">
                        <div className="deleteMsgDiv">
                            <span>Are you sure you want to delete your account?</span>
                            <div className="deleteButtonDiv">
                                <button type="button" className="deleteConfirmationButton" onClick={deleteConfirmationHandler}>
                                    Yes
                                </button>
                                <button type="button" className="deleteConfirmationButton" onClick={deleteConfirmationHandler}>
                                    No
                                </button>
                            </div>
                        </div>
                        <span className="deleteReminder">This operation is irreversible.</span>
                    </div> :
                    <form className="passwordField" autoComplete="off" onSubmit={onDeleteAccountSubmit}>
                        <div className="passwordInputContainer">
                            <label className="passwordInputLabel">
                                <input className="passwordInput" type="password" name="deleteAccountPassword" required maxLength={64} placeholder="Insert Password" autoComplete="off" />
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                            </label>
                        </div>
                        <button type="submit" className="deleteButton">
                            Delete Account
                            <Icon path={mdiDelete} size={"1em"} />
                        </button>
                    </form>}
            </div>
        )
    }
}
